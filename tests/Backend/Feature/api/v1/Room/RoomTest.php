<?php

namespace Tests\Backend\Feature\api\v1\Room;

use App\Enums\CustomStatusCodes;
use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Enums\RoomVisibility;
use App\Enums\ServerHealth;
use App\Http\Resources\RoomType as RoomTypeResource;
use App\Models\Meeting;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomToken;
use App\Models\RoomType;
use App\Models\Server;
use App\Models\User;
use App\Services\MeetingService;
use Database\Factories\RoomFactory;
use Database\Seeders\RolesAndPermissionsSeeder;
use Http;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Tests\Backend\TestCase;
use Tests\Backend\Utils\BigBlueButtonServerFaker;

/**
 * General room api feature tests
 */
class RoomTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    protected $role;

    protected $createPermission;

    protected $managePermission;

    protected $viewAllPermission;

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'bbb_skip_check_audio' => true,
        ]);

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->role = Role::factory()->create();
        $this->createPermission = Permission::where('name', 'rooms.create')->first();
        $this->managePermission = Permission::where('name', 'rooms.manage')->first();
        $this->viewAllPermission = Permission::where('name', 'rooms.viewAll')->first();
    }

    /**
     * Check if the permission inheritance is setup correct
     */
    public function testPermissionInheritances()
    {
        $this->user->roles()->attach($this->role);

        // Check without any permissions
        $this->assertFalse($this->user->can('rooms.create'));
        $this->assertFalse($this->user->can('rooms.viewAll'));
        $this->assertFalse($this->user->can('rooms.manage'));

        // Check with create rooms permission
        $this->role->permissions()->attach($this->createPermission);
        $this->assertTrue($this->user->can('rooms.create'));
        $this->assertFalse($this->user->can('rooms.viewAll'));
        $this->assertFalse($this->user->can('rooms.manage'));
        $this->role->permissions()->detach($this->createPermission);

        // Check with view all rooms permission
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->assertFalse($this->user->can('rooms.create'));
        $this->assertTrue($this->user->can('rooms.viewAll'));
        $this->assertFalse($this->user->can('rooms.manage'));
        $this->role->permissions()->detach($this->viewAllPermission);

        // Check with manage rooms permission
        $this->role->permissions()->attach($this->managePermission);
        $this->assertTrue($this->user->can('rooms.create'));
        $this->assertTrue($this->user->can('rooms.viewAll'));
        $this->assertTrue($this->user->can('rooms.manage'));
        $this->role->permissions()->detach($this->managePermission);
    }

    /**
     * Test to create a new room with and without the required permissions
     */
    public function testCreateNewRoom()
    {
        $this->roomSettings->limit = -1;
        $this->roomSettings->save();

        $room = ['room_type' => $this->faker->randomElement(RoomType::pluck('id')), 'name' => RoomFactory::createValidRoomName()];

        // Test unauthenticated user
        $this->postJson(route('api.v1.rooms.store'), $room)
            ->assertUnauthorized();

        // Test unauthorized user
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room)
            ->assertForbidden();

        // Authorize user
        $role = Role::factory()->create();
        $role->permissions()->attach($this->createPermission);
        $this->user->roles()->attach($role);

        // Try again
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room)
            ->assertCreated();

        //Test if access code gets set correctly if enforced in the room type
        // Access code enforced
        $roomType = RoomType::factory()->create([
            'has_access_code_default' => true,
            'has_access_code_enforced' => true,
        ]);

        // Non-expert settings
        $roomType->allow_guests_default = true;
        $roomType->save();

        $room = ['room_type' => $roomType->id, 'name' => RoomFactory::createValidRoomName()];

        $response = $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room)
            ->assertCreated();
        $createdRoom = Room::find($response->json('data.id'));
        $this->assertNotNull($createdRoom->access_code);

        // Check default values of non-expert settings are applied
        $this->assertTrue($createdRoom->allow_guests);

        // Access code set by default
        $roomType->has_access_code_enforced = false;

        $response = $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room)
            ->assertCreated();
        $createdRoom = Room::find($response->json('data.id'));
        $this->assertNotNull($createdRoom->access_code);

        // No Access code enforced
        $roomType = RoomType::factory()->create([
            'has_access_code_default' => false,
            'has_access_code_enforced' => true,
        ]);

        // Non-expert settings
        $roomType->allow_guests_default = false;
        $roomType->save();

        $room = ['room_type' => $roomType->id, 'name' => RoomFactory::createValidRoomName()];

        $response = $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room)
            ->assertCreated();
        $createdRoom = Room::find($response->json('data.id'));
        $this->assertNull($createdRoom->access_code);

        // Check default values of non-expert settings are applied
        $this->assertFalse($createdRoom->allow_guests);

        // No Access code by default
        $roomType->has_access_code_enforced = false;

        $response = $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room)
            ->assertCreated();
        $createdRoom = Room::find($response->json('data.id'));
        $this->assertNull($createdRoom->access_code);

        // -- Try different invalid requests --

        // empty name and invalid roomtype
        $room = ['room_type' => 0, 'name' => ''];
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room)
            ->assertJsonValidationErrors(['name', 'room_type']);

        // name too short
        $room = ['room_type' => $this->faker->randomElement(RoomType::pluck('id')), 'name' => 'A'];
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room)
            ->assertJsonValidationErrors(['name']);

        // missing parameters
        $room = [];
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room)
            ->assertJsonValidationErrors(['name', 'room_type']);
    }

    /**
     * Check if the room limit is reached and the creation of new rooms is prevented
     */
    public function testCreateNewRoomReachLimit()
    {
        $role = Role::factory()->create();
        $role->permissions()->attach($this->createPermission);
        $this->user->roles()->attach($role);
        $this->roomSettings->limit = 1;
        $this->roomSettings->save();

        $room_1 = ['room_type' => $this->faker->randomElement(RoomType::pluck('id')), 'name' => RoomFactory::createValidRoomName()];
        $room_2 = ['room_type' => $this->faker->randomElement(RoomType::pluck('id')), 'name' => RoomFactory::createValidRoomName()];

        // Create first room
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room_1)
            ->assertCreated();

        // Create second room, expect reach of limit
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room_2)
            ->assertStatus(CustomStatusCodes::ROOM_LIMIT_EXCEEDED->value);
    }

    /**
     * Test to delete a room
     */
    public function testDeleteRoom()
    {
        $room = Room::factory()->create();

        // Test unauthenticated user
        $this->deleteJson(route('api.v1.rooms.destroy', ['room' => $room]))
            ->assertUnauthorized();

        // Test with normal user
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room' => $room]))
            ->assertForbidden();

        // Test as member user
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::USER]]);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room' => $room]))
            ->assertForbidden();

        // Test as member moderator
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room' => $room]))
            ->assertForbidden();

        // Test as member co-owner
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room' => $room]))
            ->assertForbidden();

        // Remove membership
        $room->members()->sync([]);

        // Test remove with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room' => $room]))
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Test remove with manage rooms permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room' => $room]))
            ->assertNoContent();
        $this->role->permissions()->detach($this->managePermission);

        // Recreate room
        $room = Room::factory()->create();

        // Add ownership
        $room->owner()->associate($this->user);
        $room->save();

        // Test with owner
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room' => $room]))
            ->assertNoContent();

        // Try again after deleted
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room' => $room]))
            ->assertNotFound();
    }

    public function testTransferRoom()
    {
        //Create roles and users
        //Roles
        $role = Role::factory()->create();
        $role->permissions()->attach($this->createPermission);
        $role2 = Role::factory()->create();
        $role2->permissions()->attach($this->createPermission);
        //Users
        $this->user->roles()->attach($role);
        $userThatCanHaveRooms = User::factory()->create();
        $userThatCanHaveRooms->roles()->attach($role);
        $userThatCanNotHaveRooms = User::factory()->create();
        $userThatReachedLimit = User::factory()->create();
        $userThatReachedLimit->roles()->attach($role);
        $userThatCanNotHaveRoomType = User::factory()->create();
        $userThatCanNotHaveRoomType->roles()->attach($role2);
        $this->roomSettings->limit = 1;
        $this->roomSettings->save();

        //create rooms
        $room = Room::factory()->create();
        $room->roomType->restrict = true;
        $room->roomType->save();
        $room->roomType->roles()->sync([$role->id]);
        $room->save();
        //Limit room (lets userThatReachedLimit reach the limit)
        Room::factory()->create(['user_id' => $userThatReachedLimit->id]);

        //Test unauthenticated user
        $this->postJson(route('api.v1.rooms.transfer', ['room' => $room]))
            ->assertUnauthorized();

        //Test user that is not the owner of the room
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.transfer', ['room' => $room]), ['user' => -1])
            ->assertForbidden();

        //Test user that has manage permission
        $role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.transfer', ['room' => $room]), ['user' => $this->user->id])
            ->assertNoContent();
        $role->permissions()->detach($this->managePermission);

        //Make sure that the owner was changed
        $room->refresh();
        $this->assertEquals($room->owner->id, $this->user->id);

        //Test transfer room to invalid user
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.transfer', ['room' => $room]), ['user' => -1])
            ->assertJsonValidationErrors(['user']);

        //Test transfer room to current owner
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.transfer', ['room' => $room]), ['user' => $this->user->id])
            ->assertJsonValidationErrors(['user']);

        //Test transfer room to user that can have rooms
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.transfer', ['room' => $room]), ['user' => $userThatCanHaveRooms->id])
            ->assertNoContent();

        //Check if owner was changed and reset owner
        $room->refresh();
        $this->assertEquals($room->owner->id, $userThatCanHaveRooms->id);
        $room->owner()->associate($this->user);
        $room->save();

        //Test transfer room to user that can have rooms and stay in room as user
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.transfer', ['room' => $room]), ['user' => $userThatCanHaveRooms->id, 'role' => RoomUserRole::USER])
            ->assertNoContent();

        //Check if owner was changed and that the old owner was added as a user
        $room->refresh();
        $this->assertEquals($room->owner->id, $userThatCanHaveRooms->id);
        $foundOldOwner = $room->members()->find($this->user);
        $this->assertNotNull($foundOldOwner);
        $this->assertEquals(RoomUserRole::USER, $foundOldOwner->pivot->role);

        //Test transfer room to previous owner and stay in room as moderator
        $this->actingAs($userThatCanHaveRooms)->postJson(route('api.v1.rooms.transfer', ['room' => $room]), ['user' => $this->user->id, 'role' => RoomUserRole::MODERATOR])
            ->assertNoContent();

        //Check if owner was changed and that the old owner was added as a moderator
        $room->refresh();
        $this->assertEquals($room->owner->id, $this->user->id);
        $foundOldOwner = $room->members()->find($userThatCanHaveRooms);
        $this->assertNotNull($foundOldOwner);
        $this->assertEquals(RoomUserRole::MODERATOR, $foundOldOwner->pivot->role);

        //Make sure that the new owner was deleted from the members
        $foundNewOwner = $room->members()->find($this->user);
        $this->assertNull($foundNewOwner);

        //Test transfer room to user that can have rooms and stay in room as co owner
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.transfer', ['room' => $room]), ['user' => $userThatCanHaveRooms->id, 'role' => RoomUserRole::CO_OWNER])
            ->assertNoContent();

        //Check if owner was changed and that the old owner was added as a co owner
        $room->refresh();
        $this->assertEquals($room->owner->id, $userThatCanHaveRooms->id);
        $foundOldOwner = $room->members()->find($this->user);
        $this->assertNotNull($foundOldOwner);
        $this->assertEquals(RoomUserRole::CO_OWNER, $foundOldOwner->pivot->role);

        //reset owner and membership
        $room->owner()->associate($this->user);
        $room->members()->detach($this->user);
        $room->save();

        //Test transfer room to user that can have rooms but with invalid role
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.transfer', ['room' => $room]), ['user' => $userThatCanHaveRooms->id, 'role' => 10])
            ->assertJsonValidationErrors(['role']);

        //Make sure that the owner was not changed
        $room->refresh();
        $this->assertEquals($room->owner->id, $this->user->id);

        //Test transfer room to user that can not have rooms
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.transfer', ['room' => $room]), ['user' => $userThatCanNotHaveRooms->id])
            ->assertJsonValidationErrors(['user']);

        //Test transfer room to user that reached the room limit
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.transfer', ['room' => $room]), ['user' => $userThatReachedLimit->id])
            ->assertJsonValidationErrors(['user']);

        //Test transfer room to user that can not have rooms of the room type of the room
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.transfer', ['room' => $room]), ['user' => $userThatCanNotHaveRoomType->id])
            ->assertJsonValidationErrors(['user']);
    }

    /**
     * Test if guests can access room
     */
    public function testGuestAccess()
    {
        $roomTypeGuestAccessEnforced = RoomType::factory()->create([
            'allow_guests_default' => true,
            'allow_guests_enforced' => true,
        ]);
        $roomTypeNoGuestAccessDefault = RoomType::factory()->create([
            'allow_guests_default' => false,
            'allow_guests_enforced' => false,
        ]);

        $roomTypeGuestAccessDefault = RoomType::factory()->create([
            'allow_guests_default' => true,
            'allow_guests_enforced' => false,
        ]);

        $room = Room::factory()->create([
            'allow_guests' => false,
        ]);

        // Test for enforced value in the room type
        $room->roomType()->associate($roomTypeGuestAccessEnforced);
        $room->save();

        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['current_user' => null]);

        $room->allow_guests = true;
        $room->save();

        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['current_user' => null]);

        // Test for default value set to false (not enforced)
        $room->roomType()->associate($roomTypeNoGuestAccessDefault);
        $room->save();

        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['current_user' => null]);

        // Test for default value set to true (not enforced)
        $room->roomType()->associate($roomTypeGuestAccessDefault);
        $room->save();

        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['current_user' => null]);
    }

    /**
     * Test if guests are prevented from accessing room
     */
    public function testDisableGuestAccess()
    {
        $roomTypeNoGuestAccessEnforced = RoomType::factory()->create([
            'allow_guests_default' => false,
            'allow_guests_enforced' => true,
        ]);
        $roomTypeGuestAccessDefault = RoomType::factory()->create([
            'allow_guests_default' => true,
            'allow_guests_enforced' => false,
        ]);

        $roomTypeNoGuestAccessDefault = RoomType::factory()->create([
            'allow_guests_default' => false,
            'allow_guests_enforced' => false,
        ]);

        $room = Room::factory()->create([
            'allow_guests' => true,
        ]);

        // Test for enforced value in the room type
        $room->roomType()->associate($roomTypeNoGuestAccessEnforced);
        $room->save();

        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(403);

        $room->allow_guests = false;
        $room->save();

        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(403);

        // Test for default value set to true (not enforced)
        $room->roomType()->associate($roomTypeGuestAccessDefault);
        $room->save();

        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(403);

        // Test for default value set to false (not enforced)
        $room->roomType()->associate($roomTypeNoGuestAccessDefault);
        $room->save();

        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(403);
    }

    /**
     * Test how guests can log into room with or without valid access code
     */
    public function testAccessCodeGuests()
    {
        $room = Room::factory()->create([
            'allow_guests' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
        ]);
        // Try without access code
        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false])
            ->assertJsonFragment(['current_user' => null]);

        // Try with empty access code
        $this->withHeaders(['Access-Code' => ''])->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertUnauthorized();

        // Try with random access code
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertUnauthorized();

        // Try with correct access code
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonFragment(['current_user' => null]);
    }

    /**
     * Test that the existing access code setting is not changed if the default setting changes in the room type
     * (The access code in the room should not be automatically be overwritten by the room type setting)
     */
    public function testAccessCodeDifferentSettings()
    {
        $roomType = RoomType::factory()->create([
            'has_access_code_default' => true,
            'has_access_code_enforced' => true,
        ]);

        $room = Room::factory()->create([
            'allow_guests' => true,
            'room_type_id' => $roomType->id,
        ]);

        // Test room without an access code if the room type enforces an access code
        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonFragment(['current_user' => null]);

        // Test room without an access code if the room type has access code as default
        $roomType->has_access_code_enforced = false;
        $roomType->save();

        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonFragment(['current_user' => null]);

        // Test room with access code if the room type has no access code as default
        $room->access_code = $this->faker->numberBetween(111111111, 999999999);
        $room->save();
        $roomType->has_access_code_default = false;
        $roomType->save();

        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false])
            ->assertJsonFragment(['current_user' => null]);

        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonFragment(['current_user' => null]);

        // Test room with access code if the room type enforces no access code
        $roomType->has_access_code_enforced = true;
        $roomType->save();
        $this->flushHeaders();

        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false])
            ->assertJsonFragment(['current_user' => null]);

        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonFragment(['current_user' => null]);
    }

    /**
     * Test how users can log into room with or without valid access code
     */
    public function testAccessCodeUser()
    {
        $room = Room::factory()->create([
            'allow_guests' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
        ]);

        // Try without access code
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false, 'allow_membership' => false])
            ->assertJsonPath('data.current_user.id', $this->user->id);

        // Try with empty access code
        $this->withHeaders(['Access-Code' => ''])->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertUnauthorized();

        // Try with random access code
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertUnauthorized();

        // Try with correct access code
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonPath('data.current_user.id', $this->user->id);

        // Try without access code but membership
        $this->flushHeaders();

        // Try with member user
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::USER]]);
        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonPath('data.current_user.id', $this->user->id);

        // Try with member moderator
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonPath('data.current_user.id', $this->user->id);

        // Try with member co-owner
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonPath('data.current_user.id', $this->user->id);

        $room->members()->sync([]);

        // Try with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonPath('data.current_user.id', $this->user->id);
        $this->role->permissions()->detach($this->viewAllPermission);

        // Try as owner
        $room->owner()->associate($this->user);
        $room->save();
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonPath('data.current_user.id', $this->user->id);
    }

    /**
     * Test data room api returns for different values for the record attendance setting
     */
    public function testRoomViewRecordAttendance()
    {
        $roomTypeAttendanceEnforced = RoomType::factory()->create([
            'record_attendance_default' => true,
            'record_attendance_enforced' => true,
        ]);

        $roomTypeNoAttendanceEnforced = RoomType::factory()->create([
            'record_attendance_default' => false,
            'record_attendance_enforced' => true,
        ]);

        $roomTypeAttendanceDefault = RoomType::factory()->create([
            'record_attendance_default' => true,
            'record_attendance_enforced' => false,
        ]);

        $roomTypeNoAttendanceDefault = RoomType::factory()->create([
            'record_attendance_default' => false,
            'record_attendance_enforced' => false,
        ]);

        $room = Room::factory()->create();

        // Test for record attendance enforced in room type and expert mode deactivated
        $room->roomType()->associate($roomTypeAttendanceEnforced);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => true,
            ]);

        // Test for record attendance as default in room type and expert mode deactivated
        $room->roomType()->associate($roomTypeAttendanceDefault);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => true,
            ]);

        // Test for no record attendance enforced in room type and expert mode deactivated
        $room->roomType()->associate($roomTypeNoAttendanceEnforced);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => false,
            ]);

        // Test for record attendance as default in room type and expert mode deactivated
        $room->roomType()->associate($roomTypeNoAttendanceDefault);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => false,
            ]);

        // Test for record attendance enforced and expert mode activated (room setting true)
        $room->expert_mode = true;
        $room->record_attendance = true;
        $room->roomType()->associate($roomTypeAttendanceEnforced);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => true,
            ]);

        // Test for record attendance default and expert mode activated (room setting true)
        $room->roomType()->associate($roomTypeAttendanceDefault);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => true,
            ]);

        // Test for no record attendance enforced and expert mode activated (room setting true)
        $room->roomType()->associate($roomTypeNoAttendanceEnforced);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => false,
            ]);

        // Test for no record attendance default and expert mode activated (room setting true)
        $room->roomType()->associate($roomTypeNoAttendanceDefault);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => true,
            ]);

        // Test for record attendance enforced and expert mode activated (room setting false)
        $room->record_attendance = false;
        $room->roomType()->associate($roomTypeAttendanceEnforced);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => true,
            ]);

        // Test for record attendance default and expert mode activated (room setting true)
        $room->roomType()->associate($roomTypeAttendanceDefault);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => false,
            ]);

        // Test for no record attendance enforced and expert mode activated (room setting true)
        $room->roomType()->associate($roomTypeNoAttendanceEnforced);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => false,
            ]);

        // Test for no record attendance default and expert mode activated (room setting true)
        $room->roomType()->associate($roomTypeNoAttendanceDefault);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => false,
            ]);

    }

    /**
     * Test data room api returns for different values for the allow membership setting
     */
    public function testRoomViewAllowMembership()
    {
        $roomTypeMembershipEnforced = RoomType::factory()->create([
            'allow_membership_default' => true,
            'allow_membership_enforced' => true,
        ]);

        $roomTypeNoMembershipEnforced = RoomType::factory()->create([
            'allow_membership_default' => false,
            'allow_membership_enforced' => true,
        ]);

        $roomTypeMembershipDefault = RoomType::factory()->create([
            'allow_membership_default' => true,
            'allow_membership_enforced' => false,
        ]);

        $roomTypeNoMembershipDefault = RoomType::factory()->create([
            'allow_membership_default' => false,
            'allow_membership_enforced' => false,
        ]);

        $room = Room::factory()->create();

        // Test for allow membership enforced in room type and expert mode deactivated
        $room->roomType()->associate($roomTypeMembershipEnforced);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'allow_membership' => true,
            ]);

        // Test for allow membership as default in room type and expert mode deactivated
        $room->roomType()->associate($roomTypeMembershipDefault);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'allow_membership' => true,
            ]);

        // Test for no allow membership enforced in room type and expert mode deactivated
        $room->roomType()->associate($roomTypeNoMembershipEnforced);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'allow_membership' => false,
            ]);

        // Test for allow membership as default in room type and expert mode deactivated
        $room->roomType()->associate($roomTypeNoMembershipDefault);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'allow_membership' => false,
            ]);

        // Test for allow membership enforced and expert mode activated (room setting true)
        $room->expert_mode = true;
        $room->allow_membership = true;
        $room->roomType()->associate($roomTypeMembershipEnforced);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'allow_membership' => true,
            ]);

        // Test for allow membership default and expert mode activated (room setting true)
        $room->roomType()->associate($roomTypeMembershipDefault);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'allow_membership' => true,
            ]);

        // Test for no allow membership enforced and expert mode activated (room setting true)
        $room->roomType()->associate($roomTypeNoMembershipEnforced);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'allow_membership' => false,
            ]);

        // Test for no allow membership default and expert mode activated (room setting true)
        $room->roomType()->associate($roomTypeNoMembershipDefault);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'allow_membership' => true,
            ]);

        // Test for allow membership enforced and expert mode activated (room setting false)
        $room->allow_membership = false;
        $room->roomType()->associate($roomTypeMembershipEnforced);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'allow_membership' => true,
            ]);

        // Test for allow membership default and expert mode activated (room setting true)
        $room->roomType()->associate($roomTypeMembershipDefault);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'allow_membership' => false,
            ]);

        // Test for no allow membership enforced and expert mode activated (room setting true)
        $room->roomType()->associate($roomTypeNoMembershipEnforced);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'allow_membership' => false,
            ]);

        // Test for no allow membership default and expert mode activated (room setting true)
        $room->roomType()->associate($roomTypeNoMembershipDefault);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'allow_membership' => false,
            ]);

    }

    /**
     * Test data room api returns
     */
    public function testRoomView()
    {
        $room = Room::factory()->create();

        // Add usage data
        $room->participant_count = 10;
        $room->listener_count = 5;
        $room->voice_participant_count = 3;
        $room->video_count = 2;

        $room->save();

        // Test without any meetings
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $room->id,
                    'name' => $room->name,
                    'owner' => [
                        'id' => $room->owner->id,
                        'name' => $room->owner->fullName,
                    ],
                    'last_meeting' => null,
                    'type' => [
                        'id' => $room->roomType->id,
                        'name' => $room->roomType->name,
                        'color' => $room->roomType->color,
                        'model_name' => 'RoomType',
                    ],
                    'model_name' => 'Room',
                    'short_description' => $room->short_description,
                    'is_favorite' => false,
                    'authenticated' => true,
                    'is_member' => false,
                    'is_moderator' => false,
                    'is_co_owner' => false,
                    'can_start' => false,
                    'record_attendance' => false,
                    'current_user' => [
                        'id' => $this->user->id,
                        'firstname' => $this->user->firstname,
                        'lastname' => $this->user->lastname,
                        'email' => $this->user->email,
                    ],
                ],
            ]);

        // Test with ended meeting
        $meeting = Meeting::factory()->create(['room_id' => $room->id]);
        $room->latestMeeting()->associate($meeting);
        $room->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'last_meeting' => [
                        'start' => $meeting->start->toJson(),
                        'end' => $meeting->end->toJson(),
                        'detached' => null,
                        'server_connection_issues' => false,
                    ],
                ],
            ])
            ->assertJsonMissingPath('data.last_meeting.usage');

        // Test with running meeting and usage statistics
        $meeting->end = null;
        $meeting->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'last_meeting' => [
                        'start' => $meeting->start->toJson(),
                        'end' => null,
                        'detached' => null,
                        'server_connection_issues' => false,
                        'usage' => [
                            'participant_count' => 10,
                        ],
                    ],
                ],
            ])
            ->assertJsonCount(1, 'data.last_meeting.usage');

        // Test with server with connection issues
        $meeting->server->error_count = 1;
        $meeting->server->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertJsonPath('data.last_meeting.server_connection_issues', true);

        // Test with detached meeting
        $meeting->detached = now();
        $meeting->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertJsonPath('data.last_meeting.detached', $meeting->detached->toJson());
    }

    /**
     * Test list of rooms (filter, room type, favorites, own/shared/public/all)
     */
    public function testRoomList()
    {
        $roomType1 = RoomType::factory()->create();
        $roomTypePublicEnforced = RoomType::factory()->create([
            'visibility_default' => RoomVisibility::PUBLIC,
            'visibility_enforced' => true,
        ]);
        $roomTypePublicDefault = RoomType::factory()->create([
            'visibility_default' => RoomVisibility::PUBLIC,
            'visibility_enforced' => false,
        ]);
        $roomTypePrivateEnforced = RoomType::factory()->create([
            'visibility_default' => RoomVisibility::PRIVATE,
            'visibility_enforced' => true,
        ]);
        $roomTypePrivateDefault = RoomType::factory()->create([
            'visibility_default' => RoomVisibility::PRIVATE,
            'visibility_enforced' => false,
        ]);

        $roomOwn = Room::factory()->create([
            'name' => 'Own room',
            'room_type_id' => $roomType1->id,
        ]);
        $roomOwn->owner()->associate($this->user);
        $roomOwn->save();
        $roomShared = Room::factory()->create([
            'name' => 'Shared room',
            'room_type_id' => $roomType1->id,
        ]);
        $roomShared->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $roomPublicEnforced1 = Room::factory()->create([
            'name' => 'Public room enforced',
            'expert_mode' => true,
            'room_type_id' => $roomTypePublicEnforced->id,
            'visibility' => RoomVisibility::PRIVATE,
        ]);
        $roomPublicEnforced2 = Room::factory()->create([
            'name' => 'Public room enforced',
            'expert_mode' => true,
            'room_type_id' => $roomTypePublicEnforced->id,
            'visibility' => RoomVisibility::PUBLIC,
        ]);
        $roomPublicEnforced3 = Room::factory()->create([
            'name' => 'Public room enforced',
            'expert_mode' => false,
            'room_type_id' => $roomTypePublicEnforced->id,
        ]);
        $roomPublicDefault = Room::factory()->create([
            'name' => 'Public room default',
            'expert_mode' => false,
            'room_type_id' => $roomTypePublicDefault->id,
            'visibility' => RoomVisibility::PRIVATE,
        ]);
        $roomPublicExpert1 = Room::factory()->create([
            'name' => 'Public room expert',
            'expert_mode' => true,
            'room_type_id' => $roomTypePrivateDefault->id,
            'visibility' => RoomVisibility::PUBLIC,
        ]);
        $roomPublicExpert2 = Room::factory()->create([
            'name' => 'Public room expert',
            'expert_mode' => true,
            'room_type_id' => $roomTypePublicDefault->id,
            'visibility' => RoomVisibility::PUBLIC,
        ]);
        $roomPrivateEnforced1 = Room::factory()->create([
            'name' => 'Private room enforced',
            'expert_mode' => false,
            'room_type_id' => $roomTypePrivateEnforced->id,
        ]);
        $roomPrivateEnforced2 = Room::factory()->create([
            'name' => 'Private room enforced',
            'expert_mode' => true,
            'room_type_id' => $roomTypePrivateEnforced->id,
            'visibility' => RoomVisibility::PRIVATE,
        ]);
        $roomPrivateEnforced3 = Room::factory()->create([
            'name' => 'Private room enforced',
            'expert_mode' => true,
            'room_type_id' => $roomTypePrivateEnforced->id,
            'visibility' => RoomVisibility::PRIVATE,
        ]);
        $roomPrivateDefault = Room::factory()->create([
            'name' => 'Public room default',
            'expert_mode' => false,
            'room_type_id' => $roomTypePrivateDefault->id,
            'visibility' => RoomVisibility::PUBLIC,
        ]);
        $roomPrivateExpert1 = Room::factory()->create([
            'name' => 'Public room expert',
            'expert_mode' => true,
            'room_type_id' => $roomTypePublicDefault->id,
            'visibility' => RoomVisibility::PRIVATE,
        ]);
        $roomPrivateExpert2 = Room::factory()->create([
            'name' => 'Public room expert',
            'expert_mode' => true,
            'room_type_id' => $roomTypePrivateDefault->id,
            'visibility' => RoomVisibility::PRIVATE,
        ]);

        $server = Server::factory()->create();
        $meeting1 = $roomPrivateExpert1->meetings()->create();
        $meeting1->server()->associate($server);
        $meeting1->start = date('Y-m-d H:i:s');
        $meeting1->save();
        $roomPrivateExpert1->latestMeeting()->associate($meeting1);
        $roomPrivateExpert1->save();

        // Testing guests access
        $this->getJson(route('api.v1.rooms.index'))->assertUnauthorized();

        //Test without filter
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?only_favorites=0&sort_by=last_started&page=1&per_page=12')
            ->assertJsonValidationErrors(['filter_own', 'filter_shared', 'filter_public', 'filter_all']);

        //Test with logged in user
        //filter own
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=0&filter_all=0&only_favorites=0&sort_by=last_started&page=1&per_page=12')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name])
            ->assertJsonPath('meta.total_no_filter', 1)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta')
            ->assertJsonStructure([
                'data' => [
                    0 => [
                        'id',
                        'name',
                        'owner' => [
                            'id',
                            'name',
                        ],
                        'last_meeting',
                        'type' => [
                            'id',
                            'name',
                            'color',
                        ],
                        'model_name',
                        'short_description',
                        'is_favorite',
                    ],
                ],
            ]);

        //filter shared
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=0&filter_shared=1&filter_public=0&filter_all=0&only_favorites=0&sort_by=last_started&page=1&per_page=12')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id' => $roomShared->id, 'name' => $roomShared->name])
            ->assertJsonPath('meta.total_no_filter', 1)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //filter public
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=0&filter_shared=0&filter_public=1&filter_all=0&only_favorites=0&sort_by=last_started&page=1&per_page=12')
            ->assertStatus(200)
            ->assertJsonCount(6, 'data')
            ->assertJsonFragment(['id' => $roomPublicEnforced1->id, 'name' => $roomPublicEnforced1->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced2->id, 'name' => $roomPublicEnforced2->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced3->id, 'name' => $roomPublicEnforced3->name])
            ->assertJsonFragment(['id' => $roomPublicDefault->id, 'name' => $roomPublicDefault->name])
            ->assertJsonFragment(['id' => $roomPublicExpert1->id, 'name' => $roomPublicExpert1->name])
            ->assertJsonFragment(['id' => $roomPublicExpert2->id, 'name' => $roomPublicExpert2->name])
            ->assertJsonPath('meta.total_no_filter', 6)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //filter own, shared
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=0&filter_all=0&only_favorites=0&sort_by=last_started&page=1&per_page=12')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name])
            ->assertJsonFragment(['id' => $roomShared->id, 'name' => $roomShared->name])
            ->assertJsonPath('meta.total_no_filter', 2)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //filter shared, public
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=0&filter_shared=1&filter_public=1&filter_all=0&only_favorites=0&sort_by=last_started&page=1&per_page=12')
            ->assertStatus(200)
            ->assertJsonCount(7, 'data')
            ->assertJsonFragment(['id' => $roomShared->id, 'name' => $roomShared->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced1->id, 'name' => $roomPublicEnforced1->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced2->id, 'name' => $roomPublicEnforced2->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced3->id, 'name' => $roomPublicEnforced3->name])
            ->assertJsonFragment(['id' => $roomPublicDefault->id, 'name' => $roomPublicDefault->name])
            ->assertJsonFragment(['id' => $roomPublicExpert1->id, 'name' => $roomPublicExpert1->name])
            ->assertJsonFragment(['id' => $roomPublicExpert2->id, 'name' => $roomPublicExpert2->name])
            ->assertJsonPath('meta.total_no_filter', 7)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //filter own, public
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=1&filter_all=0&only_favorites=0&sort_by=last_started&page=1&per_page=12')
            ->assertStatus(200)
            ->assertJsonCount(7, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced1->id, 'name' => $roomPublicEnforced1->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced2->id, 'name' => $roomPublicEnforced2->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced3->id, 'name' => $roomPublicEnforced3->name])
            ->assertJsonFragment(['id' => $roomPublicDefault->id, 'name' => $roomPublicDefault->name])
            ->assertJsonFragment(['id' => $roomPublicExpert1->id, 'name' => $roomPublicExpert1->name])
            ->assertJsonFragment(['id' => $roomPublicExpert2->id, 'name' => $roomPublicExpert2->name])
            ->assertJsonPath('meta.total_no_filter', 7)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //filter own, shared, public
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=0&only_favorites=0&sort_by=last_started&page=1&per_page=12')
            ->assertStatus(200)
            ->assertJsonCount(8, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name])
            ->assertJsonFragment(['id' => $roomShared->id, 'name' => $roomShared->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced1->id, 'name' => $roomPublicEnforced1->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced2->id, 'name' => $roomPublicEnforced2->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced3->id, 'name' => $roomPublicEnforced3->name])
            ->assertJsonFragment(['id' => $roomPublicDefault->id, 'name' => $roomPublicDefault->name])
            ->assertJsonFragment(['id' => $roomPublicExpert1->id, 'name' => $roomPublicExpert1->name])
            ->assertJsonFragment(['id' => $roomPublicExpert2->id, 'name' => $roomPublicExpert2->name])
            ->assertJsonPath('meta.total_no_filter', 8)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //Test Favorites

        //Test without only_favorites
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=1&filter_all=0&sort_by=last_started&page=1&per_page=12')
            ->assertJsonValidationErrors(['only_favorites']);

        //Test Room List with only favorites (user has no favorites)
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=1&filter_all=0&only_favorites=1&sort_by=last_started&page=1&per_page=12')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        //Test Room List with only favorites (user has favorites)
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.favorites.add', ['room' => $roomOwn]))
            ->assertNoContent();

        $this->user->refresh();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=0&only_favorites=1&sort_by=last_started&page=1&per_page=12')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name]);

        //Test Room List with only favorites (user has several favorites)
        $this->user->roomFavorites()->attach($roomShared);
        $this->user->roomFavorites()->attach($roomPublicEnforced1);
        $this->user->roomFavorites()->attach($roomPrivateEnforced1);

        $this->user->refresh();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=0&filter_all=1&only_favorites=1&sort_by=last_started&page=1&per_page=12')
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name])
            ->assertJsonFragment(['id' => $roomShared->id, 'name' => $roomShared->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced1->id, 'name' => $roomPublicEnforced1->name])
            ->assertJsonFragment(['id' => $roomPrivateEnforced1->id, 'name' => $roomPrivateEnforced1->name]);

        //filter all (without permission to show all rooms)
        //should lead to bad request because the other filters are set to 0 (false)
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=0&filter_shared=0&filter_public=0&filter_all=1&only_favorites=0&sort_by=last_started&page=1&per_page=12')
            ->assertBadRequest();

        //should show same result as showing all the other filters together
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&per_page=12')
            ->assertStatus(200)
            ->assertJsonCount(8, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name])
            ->assertJsonFragment(['id' => $roomShared->id, 'name' => $roomShared->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced1->id, 'name' => $roomPublicEnforced1->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced2->id, 'name' => $roomPublicEnforced2->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced3->id, 'name' => $roomPublicEnforced3->name])
            ->assertJsonFragment(['id' => $roomPublicDefault->id, 'name' => $roomPublicDefault->name])
            ->assertJsonFragment(['id' => $roomPublicExpert1->id, 'name' => $roomPublicExpert1->name])
            ->assertJsonFragment(['id' => $roomPublicExpert2->id, 'name' => $roomPublicExpert2->name])
            ->assertJsonPath('meta.total_no_filter', 8)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //filter all (with permission to show all rooms)
        //should show all rooms
        $role = Role::factory()->create();
        $role->permissions()->attach($this->viewAllPermission);
        $this->user->roles()->attach($role);
        $results = $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&per_page=20')
            ->assertStatus(200)
            ->assertJsonCount(14, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name])
            ->assertJsonFragment(['id' => $roomShared->id, 'name' => $roomShared->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced1->id, 'name' => $roomPublicEnforced1->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced2->id, 'name' => $roomPublicEnforced2->name])
            ->assertJsonFragment(['id' => $roomPublicEnforced3->id, 'name' => $roomPublicEnforced3->name])
            ->assertJsonFragment(['id' => $roomPublicDefault->id, 'name' => $roomPublicDefault->name])
            ->assertJsonFragment(['id' => $roomPublicExpert1->id, 'name' => $roomPublicExpert1->name])
            ->assertJsonFragment(['id' => $roomPublicExpert2->id, 'name' => $roomPublicExpert2->name])
            ->assertJsonFragment(['id' => $roomPrivateEnforced1->id, 'name' => $roomPrivateEnforced1->name])
            ->assertJsonFragment(['id' => $roomPrivateEnforced2->id, 'name' => $roomPrivateEnforced2->name])
            ->assertJsonFragment(['id' => $roomPrivateEnforced3->id, 'name' => $roomPrivateEnforced3->name])
            ->assertJsonFragment(['id' => $roomPrivateDefault->id, 'name' => $roomPrivateDefault->name])
            ->assertJsonFragment(['id' => $roomPrivateExpert1->id, 'name' => $roomPrivateExpert1->name])
            ->assertJsonFragment(['id' => $roomPrivateExpert2->id, 'name' => $roomPrivateExpert2->name])
            ->assertJsonPath('meta.total_no_filter', 14)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        foreach ($results->json('data') as $room) {
            if ($room['id'] == $roomPrivateExpert1->id) {
                self::assertNull($room['last_meeting']['end']);
            } else {
                self::assertNull($room['last_meeting']);
            }
        }

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=0&filter_shared=0&filter_public=0&filter_all=1&only_favorites=0&sort_by=last_started&page=1&per_page=20')
            ->assertStatus(200)
            ->assertJsonCount(14, 'data')
            ->assertJsonPath('meta.total_no_filter', 14)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //filter all (with permission to show all rooms) but with room type
        //should show all rooms with the given room type
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&room_type='.$roomType1->id.'&sort_by=last_started&page=1&per_page=12')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name])
            ->assertJsonFragment(['id' => $roomShared->id, 'name' => $roomShared->name])
            ->assertJsonPath('meta.total_no_filter', 14)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');
    }

    public function testRoomListSorting()
    {
        $this->roomSettings->pagination_page_size = 10;
        $this->roomSettings->save();

        $server = Server::factory()->create();
        $roomType1 = RoomType::factory()->create(['name' => 'roomType1']);
        $roomType2 = RoomType::factory()->create(['name' => 'roomType2']);
        $roomType3 = RoomType::factory()->create(['name' => 'roomType3']);
        $roomRunning1 = Room::factory()->create(['name' => 'Running room 1', 'room_type_id' => $roomType1->id]);
        $roomRunning1->owner()->associate($this->user);
        $meetingRunning1 = Meeting::factory()->create(['room_id' => $roomRunning1->id, 'start' => '2000-01-01 11:11:00', 'end' => null, 'server_id' => $server->id]);
        $roomRunning1->latestMeeting()->associate($meetingRunning1);
        $roomRunning1->save();

        $roomRunning2 = Room::factory()->create(['name' => 'Running room 2', 'room_type_id' => $roomType3->id]);
        $roomRunning2->owner()->associate($this->user);
        $meetingRunning2 = Meeting::factory()->create(['room_id' => $roomRunning2->id, 'start' => '2000-01-01 12:21:00', 'end' => null, 'server_id' => $server->id]);
        $roomRunning2->latestMeeting()->associate($meetingRunning2);
        $roomRunning2->save();

        $roomLastStarted = Room::factory()->create(['name' => 'Last started room', 'room_type_id' => $roomType1->id]);
        $roomLastStarted->owner()->associate($this->user);
        $meetingLastStarted = Meeting::factory()->create(['room_id' => $roomLastStarted->id, 'start' => '2000-01-01 11:51:00', 'end' => '2000-01-01 12:01:00', 'server_id' => $server->id]);
        $roomLastStarted->latestMeeting()->associate($meetingLastStarted);
        $roomLastStarted->save();

        $roomLastEnded = Room::factory()->create(['name' => 'Last ended room', 'room_type_id' => $roomType2->id]);
        $roomLastEnded->owner()->associate($this->user);
        $meetingLastEnded = Meeting::factory()->create(['room_id' => $roomLastEnded->id, 'start' => '2000-01-01 11:31:00', 'end' => '2000-01-01 12:11:00', 'server_id' => $server->id]);
        $roomLastEnded->latestMeeting()->associate($meetingLastEnded);
        $roomLastEnded->save();

        $roomFirstStarted = Room::factory()->create(['name' => 'First started room', 'room_type_id' => $roomType2->id]);
        $roomFirstStarted->owner()->associate($this->user);
        $meetingFirstStarted = Meeting::factory()->create(['room_id' => $roomFirstStarted->id, 'start' => '2000-01-01 11:11:00', 'end' => '2000-01-01 11:41:00', 'server_id' => $server->id]);
        $roomFirstStarted->latestMeeting()->associate($meetingFirstStarted);
        $roomFirstStarted->save();

        $roomNeverStarted = Room::factory()->create(['name' => 'Never started room', 'room_type_id' => $roomType3->id]);
        $roomNeverStarted->owner()->associate($this->user);
        $roomNeverStarted->save();

        //without sorting (without sort_by)
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=0&filter_all=0&only_favorites=0&page=1&per_page=12')
            ->assertJsonValidationErrors(['sort_by']);

        //with invalid sorting option
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=0&filter_all=0&only_favorites=0&sort_by=invalid_option&page=1&per_page=12')
            ->assertJsonValidationErrors(['sort_by']);

        //last started
        $results = $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=0&filter_all=0&only_favorites=0&sort_by=last_started&page=1&per_page=12')
            ->assertStatus(200)
            ->assertJsonCount(6, 'data');

        $this->assertEquals($roomRunning2->id, $results->json('data')[0]['id']);
        $this->assertEquals($roomRunning1->id, $results->json('data')[1]['id']);
        $this->assertEquals($roomLastStarted->id, $results->json('data')[2]['id']);
        $this->assertEquals($roomLastEnded->id, $results->json('data')[3]['id']);
        $this->assertEquals($roomFirstStarted->id, $results->json('data')[4]['id']);
        $this->assertEquals($roomNeverStarted->id, $results->json('data')[5]['id']);

        //alphabetical
        $results = $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=0&filter_all=0&only_favorites=0&sort_by=alpha&page=1&per_page=12')
            ->assertStatus(200)
            ->assertJsonCount(6, 'data');

        $this->assertEquals($roomFirstStarted->id, $results->json('data')[0]['id']);
        $this->assertEquals($roomLastEnded->id, $results->json('data')[1]['id']);
        $this->assertEquals($roomLastStarted->id, $results->json('data')[2]['id']);
        $this->assertEquals($roomNeverStarted->id, $results->json('data')[3]['id']);
        $this->assertEquals($roomRunning1->id, $results->json('data')[4]['id']);
        $this->assertEquals($roomRunning2->id, $results->json('data')[5]['id']);

        //by room type
        $results = $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=0&filter_all=0&only_favorites=0&sort_by=room_type&page=1&per_page=12')
            ->assertStatus(200)
            ->assertJsonCount(6, 'data');

        $this->assertEquals($roomLastStarted->id, $results->json('data')[0]['id']);
        $this->assertEquals($roomRunning1->id, $results->json('data')[1]['id']);
        $this->assertEquals($roomFirstStarted->id, $results->json('data')[2]['id']);
        $this->assertEquals($roomLastEnded->id, $results->json('data')[3]['id']);
        $this->assertEquals($roomNeverStarted->id, $results->json('data')[4]['id']);
        $this->assertEquals($roomRunning2->id, $results->json('data')[5]['id']);
    }

    public function testFavorites()
    {
        $roomOwn = Room::factory()->create(['name' => 'Own room']);
        $roomOwn->owner()->associate($this->user);
        $roomOwn->save();

        //Try to add room to the favorites (guest)
        $this->postJson(route('api.v1.rooms.favorites.add', ['room' => $roomOwn]))
            ->assertUnauthorized();

        //Try to delete room from the favorites (guest)
        $this->deleteJson(route('api.v1.rooms.favorites.add', ['room' => $roomOwn]))
            ->assertUnauthorized();

        //Try to add room to the favorites (logged in user)
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.favorites.add', ['room' => $roomOwn]))
            ->assertNoContent();

        //Check if room was added to the favorites
        $this->assertNotNull($this->user->roomFavorites()->find($roomOwn));

        //Try to add room again
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.favorites.add', ['room' => $roomOwn]))
            ->assertNoContent();

        //Check if room was added to the favorites
        $this->assertNotNull($this->user->roomFavorites()->find($roomOwn));
        //Make sure that the room was not added again
        $this->assertEquals(1, $this->user->roomFavorites()->count());

        //Try to delete room from the favorites
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.favorites.add', ['room' => $roomOwn]))
            ->assertNoContent();

        //Check if room was deleted from the favorites
        $this->assertNull($this->user->roomFavorites()->find($roomOwn));

        //Try to delete favorite again
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.favorites.add', ['room' => $roomOwn]))
            ->assertNoContent();

        //Check if room is still deleted
        $this->assertNull($this->user->roomFavorites()->find($roomOwn));

        //Try to delete room from the favorites that is no favorite
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.favorites.add', ['room' => $roomOwn]))
            ->assertNoContent();

        //Check if room is still deleted
        $this->assertNull($this->user->roomFavorites()->find($roomOwn));
        $this->assertEquals(0, $this->user->roomFavorites()->count());
    }

    /**
     * Test search for rooms
     */
    public function testRoomSearch()
    {
        $user = User::factory()->create(['firstname' => 'John', 'lastname' => 'Doe']);
        $room1 = Room::factory()->create(['name' => 'Test a', 'user_id' => $user->id]);
        $room2 = Room::factory()->create(['name' => 'room b', 'user_id' => $user->id]);

        $role = Role::factory()->create();
        $role->permissions()->attach($this->viewAllPermission);
        $this->user->roles()->attach($role);

        // Testing without query
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&per_page=12')
            ->assertOk()
            ->assertJsonFragment(['id' => $room1->id])
            ->assertJsonFragment(['id' => $room2->id])
            ->assertJsonPath('meta.total_no_filter', 2);

        // Testing with empty query
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&per_page=12&search=')
            ->assertJsonValidationErrors('search');

        // Find by room name
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&per_page=12&search=Test')
            ->assertOk()
            ->assertJsonFragment(['id' => $room1->id])
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total_no_filter', 2);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&per_page=12&search=Test+a')
            ->assertOk()
            ->assertJsonFragment(['id' => $room1->id])
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total_no_filter', 2);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&per_page=12&search=Test+a+xyz')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // Find by owner name
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&per_page=12&search=john')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&per_page=12&search=john+d')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&per_page=12&search=john+d+xyz')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        //Find by owner name and room name
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&per_page=12&search=test+john')
            ->assertOk()
            ->assertJsonFragment(['id' => $room1->id])
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total_no_filter', 2);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&per_page=12&search=test+john+xyz')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    /**
     * Test callback route for meetings
     */
    public function testEndMeetingCallback()
    {
        $room = Room::factory()->create();
        $server = Server::factory()->create();

        $meeting = $room->meetings()->create();
        $meeting->server()->associate($server);
        $meeting->start = date('Y-m-d H:i:s');
        $meeting->save();

        self::assertNull($meeting->end);

        $url = (new MeetingService($meeting))->getCallbackUrl();
        // check with invalid salt
        $this->getJson($url.'test')
            ->assertUnauthorized();

        $this->getJson($url)
            ->assertSuccessful();

        // Check if timestamp was set
        $meeting->refresh();
        self::assertNotNull($meeting->end);
        $end = $meeting->end;

        // Check if second call doesn't change timestamp
        $this->getJson($url)
            ->assertSuccessful();

        $meeting->refresh();
        self::assertEquals($meeting->end, $end);
    }

    public function testSettingsAccess()
    {
        $room = Room::factory()->create();

        // Testing guests access
        $this->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertUnauthorized();

        // Testing access any user
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertForbidden();

        // Testing member
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertForbidden();

        // Testing member as moderator
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertForbidden();

        // Testing member as co-owner
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful();

        // Reset room membership
        $room->members()->sync([]);

        // Try with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Testing access owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful();
    }

    public function testAccessCodeShown()
    {
        $room = Room::factory()->create([
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
        ]);

        // Testing unauthenticated user
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonMissing(['access_code' => $room->access_code]);

        // Testing authenticated user
        $this->withHeaders(['Access-Code' => $room->access_code])->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonMissing(['access_code' => $room->access_code]);
        $this->flushHeaders();

        // Testing member
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonMissing(['access_code' => $room->access_code]);

        // Testing member as moderator
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonFragment(['access_code' => $room->access_code]);

        // Testing member as co-owner
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonFragment(['access_code' => $room->access_code]);

        // Reset room membership
        $room->members()->sync([]);

        // Try with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonFragment(['access_code' => $room->access_code]);
        $this->role->permissions()->detach($this->viewAllPermission);

        // Testing access owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonFragment(['access_code' => $room->access_code]);
    }

    /**
     * Test the permissions to update the room settings
     */
    public function testUpdateSettingsPermission()
    {
        $room = Room::factory()->create();

        // Get current settings
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful();

        $settings = $response->json('data');

        $roomType = RoomType::factory()->create();

        // Test with expert mode deactivated (only necessary settings)
        $settings['room_type'] = $roomType->id;
        $settings['name'] = RoomFactory::createValidRoomName();

        // Testing user
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertForbidden();

        // Testing member as user
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::USER]]);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertForbidden();

        // Testing member as moderator
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertForbidden();

        // Testing member as co-owner
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertSuccessful();

        // Reset room membership
        $room->members()->sync([]);

        // Try with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Try with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertSuccessful();
        $this->role->permissions()->detach($this->managePermission);

        // Test as owner
        $this->actingAs($room->owner)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertSuccessful();
    }

    /**
     * Test updating the room settings when the expert mode is deactivated and only the necessary parameters are send
     */
    public function testUpdateSettingsNoExpertOnlyNecessary()
    {
        $room = Room::factory()->create();
        $roomType = RoomType::factory()->create();

        $roomTypeGuestsEnforced = RoomType::factory()->create([
            'allow_guests_default' => true,
            'allow_guests_enforced' => true,
        ]);
        $roomTypeNoGuestsEnforced = RoomType::factory()->create([
            'allow_guests_default' => false,
            'allow_guests_enforced' => true,
        ]);

        // Test without allow guests enforced in room type
        $settings['access_code'] = $this->faker->numberBetween(111111111, 999999999);
        $settings['room_type'] = $roomType->id;
        $settings['expert_mode'] = false;
        $settings['name'] = RoomFactory::createValidRoomName();
        $settings['allow_guests'] = true;
        $settings['short_description'] = $this->faker->text(300);

        $this->actingAs($room->owner)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertSuccessful();

        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'access_code' => $settings['access_code'],
                'name' => $settings['name'],
                'allow_guests' => true,
                'short_description' => $settings['short_description'],
            ])
            ->assertJsonPath('data.room_type.id', $roomType->id);

        // Test with allow guests enforced in room type (room setting true)
        $settings['room_type'] = $roomTypeGuestsEnforced->id;

        $this->actingAs($room->owner)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertSuccessful();

        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'access_code' => $settings['access_code'],
                'name' => $settings['name'],
                'allow_guests' => true,
                'short_description' => $settings['short_description'],
            ])
            ->assertJsonPath('data.room_type.id', $roomTypeGuestsEnforced->id);

        // Test with not allowing guests enforced in room type (room setting true)
        $settings['room_type'] = $roomTypeNoGuestsEnforced->id;

        $this->actingAs($room->owner)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertSuccessful();

        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'access_code' => $settings['access_code'],
                'name' => $settings['name'],
                'allow_guests' => false,
                'short_description' => $settings['short_description'],
            ])
            ->assertJsonPath('data.room_type.id', $roomTypeNoGuestsEnforced->id);

        // Test with not allowing guests enforced in room type (room setting false)
        $settings['allow_guests'] = false;

        $this->actingAs($room->owner)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertSuccessful();

        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'access_code' => $settings['access_code'],
                'name' => $settings['name'],
                'allow_guests' => false,
                'short_description' => $settings['short_description'],
            ])
            ->assertJsonPath('data.room_type.id', $roomTypeNoGuestsEnforced->id);

        // Test with allow guests enforced in room type (room setting false)
        $settings['room_type'] = $roomTypeGuestsEnforced->id;

        $this->actingAs($room->owner)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertSuccessful();

        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'access_code' => $settings['access_code'],
                'name' => $settings['name'],
                'allow_guests' => true,
                'short_description' => $settings['short_description'],
            ])
            ->assertJsonPath('data.room_type.id', $roomTypeGuestsEnforced->id);
    }

    /**
     * Test updating the room settings when the expert mode is deactivated and all parameters are send
     */
    public function testUpdateSettingsNoExpertAll()
    {
        $room = Room::factory()->create();
        $roomType = RoomType::factory()->create([
            'allow_membership_default' => false,
            'everyone_can_start_default' => true,
            'lock_settings_disable_cam_default' => false,
            'lock_settings_disable_mic_default' => true,
            'lock_settings_disable_note_default' => false,
            'lock_settings_disable_private_chat_default' => true,
            'lock_settings_disable_public_chat_default' => false,
            'lock_settings_hide_user_list_default' => true,
            'mute_on_start_default' => false,
            'webcams_only_for_moderator_default' => true,
            'default_role_default' => RoomUserRole::MODERATOR,
            'lobby_default' => RoomLobby::ENABLED,
            'visibility_default' => RoomVisibility::PRIVATE,
            'record_attendance_default' => false,
            'record_default' => false,
            'auto_start_recording_default' => false,
        ]);

        $settings['access_code'] = $this->faker->numberBetween(111111111, 999999999);
        $settings['expert_mode'] = false;
        $settings['room_type'] = $roomType->id;
        $settings['name'] = RoomFactory::createValidRoomName();
        $settings['allow_guests'] = true;
        $settings['short_description'] = $this->faker->text(300);
        $settings['allow_membership'] = true;
        $settings['everyone_can_start'] = false;
        $settings['lock_settings_disable_cam'] = true;
        $settings['lock_settings_disable_mic'] = false;
        $settings['lock_settings_disable_note'] = true;
        $settings['lock_settings_disable_private_chat'] = false;
        $settings['lock_settings_disable_public_chat'] = true;
        $settings['lock_settings_hide_user_list'] = false;
        $settings['mute_on_start'] = true;
        $settings['webcams_only_for_moderator'] = false;
        $settings['default_role'] = RoomUserRole::USER;
        $settings['lobby'] = RoomLobby::DISABLED;
        $settings['welcome'] = $this->faker->text;
        $settings['visibility'] = RoomVisibility::PUBLIC;
        $settings['record_attendance'] = true;
        $settings['record'] = true;
        $settings['auto_start_recording'] = true;

        $this->actingAs($room->owner)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertSuccessful();

        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'access_code' => $settings['access_code'],
                'name' => $settings['name'],
                'allow_guests' => true,
                'short_description' => $settings['short_description'],
                'allow_membership' => false,
                'everyone_can_start' => true,
                'lock_settings_disable_cam' => false,
                'lock_settings_disable_mic' => true,
                'lock_settings_disable_note' => false,
                'lock_settings_disable_private_chat' => true,
                'lock_settings_disable_public_chat' => false,
                'lock_settings_hide_user_list' => true,
                'mute_on_start' => false,
                'webcams_only_for_moderator' => true,
                'default_role' => RoomUserRole::MODERATOR,
                'lobby' => RoomLobby::ENABLED,
                'visibility' => RoomVisibility::PRIVATE,
                'record_attendance' => false,
                'record' => false,
                'auto_start_recording' => false,
                'welcome' => '',
            ])
            ->assertJsonPath('data.room_type.id', $roomType->id);

        // Try with different combination
        $roomType->allow_membership_default = true;
        $roomType->lock_settings_disable_mic_default = false;
        $roomType->lock_settings_disable_note_default = true;
        $roomType->lock_settings_hide_user_list_default = false;
        $roomType->mute_on_start_default = true;
        $roomType->default_role_default = RoomUserRole::USER;
        $roomType->lobby_default = RoomLobby::ONLY_GUEST;
        $roomType->visibility_default = RoomVisibility::PUBLIC;
        $roomType->record_attendance_default = true;
        $roomType->record_default = true;
        $roomType->auto_start_recording_default = true;
        $roomType->save();

        $settings['allow_membership'] = false;
        $settings['everyone_can_start'] = true;
        $settings['lock_settings_disable_cam'] = false;
        $settings['welcome'] = $this->faker->text;
        $settings['visibility'] = RoomVisibility::PRIVATE;
        $settings['record_attendance'] = false;
        $settings['record'] = false;
        $settings['auto_start_recording'] = false;

        $this->actingAs($room->owner)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertSuccessful();

        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'access_code' => $settings['access_code'],
                'name' => $settings['name'],
                'allow_guests' => true,
                'short_description' => $settings['short_description'],
                'allow_membership' => true,
                'everyone_can_start' => true,
                'lock_settings_disable_cam' => false,
                'lock_settings_disable_mic' => false,
                'lock_settings_disable_note' => true,
                'lock_settings_disable_private_chat' => true,
                'lock_settings_disable_public_chat' => false,
                'lock_settings_hide_user_list' => false,
                'mute_on_start' => true,
                'webcams_only_for_moderator' => true,
                'default_role' => RoomUserRole::USER,
                'lobby' => RoomLobby::ONLY_GUEST,
                'visibility' => RoomVisibility::PUBLIC,
                'record_attendance' => true,
                'record' => true,
                'auto_start_recording' => true,
                'welcome' => '',
            ])
            ->assertJsonPath('data.room_type.id', $roomType->id);
    }

    /**
     * Test updating the room settings when the expert mode is activated
     */
    public function testUpdateSettingsExpert()
    {
        $room = Room::factory()->create();
        $roomType = RoomType::factory()->create([
            'allow_membership_default' => true,
            'allow_membership_enforced' => true,
            'everyone_can_start_default' => false,
            'everyone_can_start_enforced' => true,
            'lock_settings_disable_cam_default' => true,
            'lock_settings_disable_cam_enforced' => false,
            'lock_settings_disable_mic_default' => false,
            'lock_settings_disable_mic_enforced' => false,
            'lock_settings_disable_note_default' => true,
            'lock_settings_disable_note_enforced' => true,
            'lock_settings_disable_private_chat_default' => false,
            'lock_settings_disable_private_chat_enforced' => true,
            'lock_settings_disable_public_chat_default' => true,
            'lock_settings_disable_public_chat_enforced' => false,
            'lock_settings_hide_user_list_default' => false,
            'lock_settings_hide_user_list_enforced' => false,
            'mute_on_start_default' => true,
            'mute_on_start_enforced' => true,
            'webcams_only_for_moderator_default' => false,
            'webcams_only_for_moderator_enforced' => true,
            'default_role_default' => RoomUserRole::MODERATOR,
            'default_role_enforced' => false,
            'lobby_default' => RoomLobby::ENABLED,
            'lobby_enforced' => true,
            'visibility_default' => RoomVisibility::PRIVATE,
            'visibility_enforced' => false,
            'record_attendance_default' => true,
            'record_attendance_enforced' => false,
            'record_default' => true,
            'record_enforced' => false,
            'auto_start_recording_default' => true,
            'auto_start_recording_enforced' => false,
            'allow_guests_default' => false,
            'allow_guests_enforced' => false,
            'has_access_code_default' => true,
            'has_access_code_enforced' => false,
            'restrict' => false,
        ]);

        $settings['access_code'] = $this->faker->numberBetween(111111111, 999999999);
        $settings['expert_mode'] = true;
        $settings['room_type'] = $roomType->id;
        $settings['name'] = RoomFactory::createValidRoomName();
        $settings['allow_guests'] = true;
        $settings['short_description'] = $this->faker->text(300);
        $settings['allow_membership'] = false;
        $settings['everyone_can_start'] = false;
        $settings['lock_settings_disable_cam'] = false;
        $settings['lock_settings_disable_mic'] = false;
        $settings['lock_settings_disable_note'] = true;
        $settings['lock_settings_disable_private_chat'] = true;
        $settings['lock_settings_disable_public_chat'] = true;
        $settings['lock_settings_hide_user_list'] = true;
        $settings['mute_on_start'] = false;
        $settings['webcams_only_for_moderator'] = false;
        $settings['default_role'] = RoomUserRole::USER;
        $settings['lobby'] = RoomLobby::DISABLED;
        $settings['visibility'] = RoomVisibility::PUBLIC;
        $settings['record_attendance'] = true;
        $settings['record'] = true;
        $settings['auto_start_recording'] = true;
        $settings['welcome'] = $this->faker->text;

        $this->actingAs($room->owner)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertSuccessful();

        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonFragment([
                'access_code' => $settings['access_code'],
                'name' => $settings['name'],
                'allow_guests' => true,
                'short_description' => $settings['short_description'],
                'allow_membership' => true,
                'everyone_can_start' => false,
                'lock_settings_disable_cam' => false,
                'lock_settings_disable_mic' => false,
                'lock_settings_disable_note' => true,
                'lock_settings_disable_private_chat' => false,
                'lock_settings_disable_public_chat' => true,
                'lock_settings_hide_user_list' => true,
                'mute_on_start' => true,
                'webcams_only_for_moderator' => false,
                'default_role' => RoomUserRole::USER,
                'lobby' => RoomLobby::ENABLED,
                'visibility' => RoomVisibility::PUBLIC,
                'record_attendance' => true,
                'record' => true,
                'auto_start_recording' => true,
                'welcome' => $settings['welcome'],
            ])
            ->assertJsonPath('data.room_type.id', $roomType->id);

        // Try with different combination
        $roomType->allow_membership_default = true;
        $roomType->allow_membership_enforced = false;
        $roomType->lock_settings_disable_mic_default = true;
        $roomType->lock_settings_disable_note_default = true;
        $roomType->lock_settings_hide_user_list_enforced = true;
        $roomType->mute_on_start_default = false;
        $roomType->default_role_enforced = true;
        $roomType->lobby_enforced = false;
        $roomType->visibility_enforced = true;
        $roomType->save();

        $settings['everyone_can_start'] = true;
        $settings['lock_settings_disable_cam'] = true;
        $settings['lock_settings_disable_mic'] = true;
        $settings['lock_settings_disable_private_chat'] = false;
        $settings['lock_settings_hide_user_list'] = false;
        $settings['mute_on_start'] = true;
        $settings['webcams_only_for_moderator'] = true;
        $settings['visibility'] = RoomVisibility::PRIVATE;
        $settings['record_attendance'] = false;
        $settings['record'] = false;
        $settings['auto_start_recording'] = false;

        $this->actingAs($room->owner)->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertSuccessful();

        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful();

        // Check if correct setting values get returned
        $new_settings = $response->json('data');
        $settings['room_type'] = (new RoomTypeResource($roomType))->withDefaultRoomSettings();
        $settings['allow_membership'] = false;
        $settings['everyone_can_start'] = false;
        $settings['lock_settings_disable_cam'] = true;
        $settings['lock_settings_disable_mic'] = true;
        $settings['lock_settings_disable_note'] = true;
        $settings['lock_settings_disable_private_chat'] = false;
        $settings['lock_settings_disable_public_chat'] = true;
        $settings['lock_settings_hide_user_list'] = false;
        $settings['mute_on_start'] = false;
        $settings['webcams_only_for_moderator'] = false;
        $settings['default_role'] = RoomUserRole::MODERATOR;
        $settings['lobby'] = RoomLobby::DISABLED;
        $settings['visibility'] = RoomVisibility::PRIVATE;
        $settings['record_attendance'] = false;
        $settings['record'] = false;
        $settings['auto_start_recording'] = false;

        $this->assertJsonStringEqualsJsonString(json_encode($new_settings), json_encode($settings));

    }

    public function testUpdateSettingsInvalid()
    {
        config(['bigbluebutton.welcome_message_limit' => 5]);
        $room = Room::factory()->create([
            'expert_mode' => true,
        ]);
        // Get current settings
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful();

        $settings = $response->json('data');

        // Access code enforced but has no access code
        $roomType = RoomType::factory()->create([
            'has_access_code_default' => true,
            'has_access_code_enforced' => true,
        ]);

        $settings['access_code'] = null;
        $settings['room_type'] = $roomType->id;
        $this->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertJsonValidationErrors(['access_code']);

        // No Access code enforced but has an access code
        $roomType = RoomType::factory()->create([
            'has_access_code_default' => false,
            'has_access_code_enforced' => true,
        ]);

        $settings['access_code'] = $this->faker->numberBetween(111111111, 999999999);
        $settings['room_type'] = $roomType->id;
        $this->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertJsonValidationErrors(['access_code']);

        // Room type invalid format
        $settings['room_type'] = ['id' => 5];
        $this->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertJsonValidationErrors(['room_type']);

        // Name too short
        $settings['name'] = 'A';
        $settings['room_type'] = $this->faker->randomElement(RoomType::pluck('id'));
        $this->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertJsonValidationErrors(['name']);

        // Invalid parameters expert mode activated
        $settings['access_code'] = $this->faker->numberBetween(1111111, 9999999);
        $settings['default_role'] = RoomUserRole::GUEST;
        $settings['lobby'] = 5;
        $settings['name'] = null;
        $settings['room_type'] = 0;
        $settings['expert_mode'] = true;
        $settings['allow_membership'] = 'yes';
        $settings['everyone_can_start'] = 'no';
        $settings['lock_settings_disable_cam'] = 'yes';
        $settings['lock_settings_disable_mic'] = 'yes';
        $settings['lock_settings_disable_note'] = 'yes';
        $settings['lock_settings_disable_private_chat'] = 'no';
        $settings['lock_settings_disable_public_chat'] = 'no';
        $settings['lock_settings_hide_user_list'] = 'no';
        $settings['mute_on_start'] = 'no';
        $settings['webcams_only_for_moderator'] = 'no';
        $settings['allow_guests'] = 'no';
        $settings['welcome'] = $this->faker->textWithLength(6);
        $settings['short_description'] = $this->faker->textWithLength(301);
        $settings['visibility'] = 10;
        $settings['record_attendance'] = 'no';

        $this->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertJsonValidationErrors([
                'access_code',
                'default_role',
                'lobby',
                'name',
                'room_type',
                'allow_membership',
                'everyone_can_start',
                'lock_settings_disable_cam',
                'lock_settings_disable_mic',
                'lock_settings_disable_note',
                'lock_settings_disable_private_chat',
                'lock_settings_disable_public_chat',
                'lock_settings_hide_user_list',
                'mute_on_start',
                'webcams_only_for_moderator',
                'allow_guests',
                'welcome',
                'short_description',
                'visibility',
                'record_attendance',
            ]);

        // Invalid parameters expert mode deactivated
        $settings['expert_mode'] = false;

        $this->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertJsonValidationErrors([
                'access_code',
                'name',
                'room_type',
                'allow_guests',
                'short_description',
            ]);

        // Missing parameters
        $settings = [];
        $this->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertJsonValidationErrors([
                'name',
                'expert_mode',
                'room_type',
                'expert_mode',
                'allow_guests',
            ]);
    }

    /**
     * Testing to start room but no server available
     */
    public function testStartRestrictedNoServer()
    {
        $room = Room::factory()->create([
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
        ]);

        // Testing guests
        $this->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $room->access_code])->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertForbidden();
        $this->flushHeaders();

        // Testing authorized users
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $room->access_code])->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertForbidden();
        $this->flushHeaders();

        // Testing member
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertForbidden();

        // Testing member as moderator
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE->value);

        // Testing member as co-owner
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE->value);

        // Reset room membership
        $room->members()->sync([]);

        // Try with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Try with manage all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE->value);
        $this->role->permissions()->detach($this->managePermission);

        // Testing owner
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE->value);
    }

    /**
     * Testing to start room with guests allowed, and everyone can start but no server available
     */
    public function testStartNoServer()
    {
        $room = Room::factory()->create([
            'allow_guests' => true,
            'expert_mode' => true,
            'everyone_can_start' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
        ]);

        // Testing guests
        $this->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertUnauthorized();
        $this->withHeaders(['Access-Code' => $room->access_code])->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertJsonValidationErrors('name');
        // Join as guest with invalid/dangerous name
        $this->withHeaders(['Access-Code' => $room->access_code])->postJson(route('api.v1.rooms.start', ['room' => $room]), ['name' => '<script>alert("HI");</script>', 'consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertJsonValidationErrors('name')
            ->assertJsonFragment([
                'errors' => [
                    'name' => [
                        'Name contains the following non-permitted characters: <>";',
                    ],
                ],
            ]);
        // Join as guest with invalid/dangerous name that contains non utf8 chars
        $this->withHeaders(['Access-Code' => $room->access_code])->postJson(route('api.v1.rooms.start', ['room' => $room]), ['name' => '§´`', 'consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertJsonValidationErrors('name')
            ->assertJsonFragment([
                'errors' => [
                    'name' => [
                        'Name contains non-permitted characters',
                    ],
                ],
            ]);

        $this->withHeaders(['Access-Code' => $room->access_code])->postJson(route('api.v1.rooms.start', ['room' => $room]), ['name' => $this->faker->name, 'consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE->value);

        $this->flushHeaders();

        // Testing authorized users
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertUnauthorized();
        $this->withHeaders(['Access-Code' => $room->access_code])->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE->value);

        $this->flushHeaders();

        // Testing owner
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE->value);

        // Testing member
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE->value);
    }

    public function testStartAndJoinWithWrongServerDetails()
    {
        $room = Room::factory()->create();

        // Adding fake server(s)
        $server = Server::factory()->create();
        $room->roomType->serverPool->servers()->sync([$server->id]);

        $this->assertEquals(ServerHealth::ONLINE, $server->health);

        // Create meeting
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::ROOM_START_FAILED->value);

        $server->refresh();
        $this->assertEquals(ServerHealth::UNHEALTHY, $server->health);

        // Create meeting
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::ROOM_NOT_RUNNING->value);
    }

    public function testStartServerErrors()
    {
        $room = Room::factory()->create();

        Http::fake([
            'test.notld/bigbluebutton/api/create*' => Http::response('Error', 500),
        ]);

        // Adding fake server(s)
        $server = Server::factory()->create();
        $room->roomType->serverPool->servers()->sync([$server->id]);

        // Create meeting
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::ROOM_START_FAILED->value);
    }

    /**
     * Tests starting new meeting with a running bbb server
     */
    public function testStartWithServer()
    {
        $room = Room::factory()->create(['expert_mode' => true, 'record_attendance' => true, 'delete_inactive' => now()->addDay()]);
        $room->owner->update(['bbb_skip_check_audio' => true]);

        $server = Server::factory()->create();
        $room->roomType->serverPool->servers()->attach($server);

        // Create Fake BBB-Server
        $bbbfaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);
        // Create and end 6 meetings
        for ($i = 0; $i < 6; $i++) {
            $bbbfaker->addCreateMeetingRequest();
            $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../../../Fixtures/EndMeeting.xml')));
        }

        // Create meeting
        $response = $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $this->assertIsString($response->json('url'));
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('true', $queryParams['userdata-bbb_skip_check_audio']);

        // Check if delete flag is removed on start
        $room->refresh();
        $this->assertNull($room->delete_inactive);

        // Clear
        (new MeetingService($room->latestMeeting))->end();

        // Create meeting without agreement to record attendance
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertJsonValidationErrors(['consent_record_attendance']);

        // Create meeting without invalid record attendance values
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => 'test', 'consent_record' => false, 'consent_record_video' => false])
            ->assertJsonValidationErrors(['consent_record_attendance']);
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]))
            ->assertJsonValidationErrors(['consent_record_attendance']);

        // Create meeting with attendance disabled
        $room->record_attendance = false;
        $room->save();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Clear
        $room->refresh();
        (new MeetingService($room->latestMeeting))->end();

        // Room token moderator
        Auth::logout();

        $moderatorToken = RoomToken::factory()->create([
            'room_id' => $room->id,
            'role' => RoomUserRole::MODERATOR,
            'firstname' => 'John',
            'lastname' => 'Doe',
        ]);

        $response = $this->withHeaders(['Token' => $moderatorToken->token])
            ->postJson(route('api.v1.rooms.start', ['room' => $room]), ['name' => 'Max Mustermann', 'consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false]);
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals('John Doe', $params['fullName']);

        // Clear
        $room->refresh();
        (new MeetingService($room->latestMeeting))->end();

        $this->flushHeaders();

        $room->allow_guests = true;
        $room->everyone_can_start = false;
        $room->save();

        $this->withHeaders(['Token' => 'Test'])
            ->postJson(route('api.v1.rooms.start', ['room' => $room]), ['name' => 'Max Mustermann', 'consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertUnauthorized();

        $this->flushHeaders();

        // Room token user
        $userToken = RoomToken::factory()->create([
            'room_id' => $room->id,
            'role' => RoomUserRole::USER,
            'firstname' => 'John',
            'lastname' => 'Doe',
        ]);

        $this->withHeaders(['Token' => $userToken->token])
            ->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertForbidden();

        $this->flushHeaders();

        $room->everyone_can_start = true;
        $room->save();

        $response = $this->withHeaders(['Token' => $userToken->token])
            ->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false]);
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals('John Doe', $params['fullName']);

        // Clear
        $room->refresh();
        (new MeetingService($room->latestMeeting))->end();

        $this->flushHeaders();

        // Token with authenticated user
        $response = $this->withHeaders(['Token' => $userToken->token])
            ->actingAs($this->user)
            ->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false]);
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals($this->user->fullName, $params['fullName']);

        // Clear
        $room->refresh();
        (new MeetingService($room->latestMeeting))->end();

        $this->flushHeaders();

        // Check with wrong salt/secret
        foreach (Server::all() as $server) {
            $server->secret = 'TEST';
            $server->save();
        }
        $room2 = Room::factory()->create(['room_type_id' => $room->roomType->id, 'expert_mode' => true]);
        $this->actingAs($room2->owner)->postJson(route('api.v1.rooms.start', ['room' => $room2]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::ROOM_START_FAILED->value);

        // Owner with invalid room type
        $room->roomType->roles()->attach($this->role);
        $room->roomType->update(['restrict' => true]);
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::ROOM_TYPE_INVALID->value);

        // User with invalid room type
        $room->everyone_can_start = true;
        $room->save();
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::ROOM_TYPE_INVALID->value);
    }

    /**
     * Tests starting new meeting with an already running meeting
     * (without checking if it is actually running, detecting detached meetings in the pollers responsibility)
     */
    public function testStartWithServerMeetingRunning()
    {
        $room = Room::factory()->create();

        $server = Server::factory()->create();
        $room->roomType->serverPool->servers()->attach($server);

        $meeting = Meeting::factory()->create(['room_id' => $room->id, 'start' => null, 'end' => null, 'server_id' => Server::all()->first()]);
        $room->latestMeeting()->associate($meeting);
        $room->save();

        // Start room that should run on the server but server times out
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(474);
    }

    /**
     * Tests parallel starting of the same room
     */
    public function testStartWhileStarting()
    {
        config(['bigbluebutton.server_timeout' => 2]);
        config(['bigbluebutton.server_connect_timeout' => 2]);
        $room = Room::factory()->create();
        $timeout = config('bigbluebutton.server_timeout') + config('bigbluebutton.server_connect_timeout');
        $lock = Cache::lock('startroom-'.$room->id, $timeout);

        try {
            // Simulate that another request is currently starting this room
            $lock->block($timeout);

            // Try to start the room
            $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
                ->assertStatus(462);

            $lock->release();
        } catch (LockTimeoutException $e) {
            $this->fail('lock did not work');
        }
    }

    /**
     * Tests if record attendance is set on start
     */
    public function testRecordAttendanceStatus()
    {
        // Room types
        $roomTypeAttendanceEnforced = RoomType::factory()->create([
            'record_attendance_default' => true,
            'record_attendance_enforced' => true,
        ]);

        $roomTypeNoAttendanceEnforced = RoomType::factory()->create([
            'record_attendance_default' => false,
            'record_attendance_enforced' => true,
        ]);

        $roomTypeAttendanceDefault = RoomType::factory()->create([
            'record_attendance_default' => true,
            'record_attendance_enforced' => false,
        ]);

        $roomTypeNoAttendanceDefault = RoomType::factory()->create([
            'record_attendance_default' => false,
            'record_attendance_enforced' => false,
        ]);

        // Rooms
        $roomAttendanceEnforced1 = Room::factory()->create([
            'expert_mode' => true,
            'record_attendance' => false,
            'room_type_id' => $roomTypeAttendanceEnforced->id,

        ]);
        $roomAttendanceEnforced2 = Room::factory()->create([
            'expert_mode' => true,
            'record_attendance' => true,
            'room_type_id' => $roomTypeAttendanceEnforced->id,

        ]);
        $roomAttendanceEnforced3 = Room::factory()->create([
            'expert_mode' => false,
            'room_type_id' => $roomTypeAttendanceEnforced->id,
        ]);
        $roomAttendanceDefault = Room::factory()->create([
            'expert_mode' => false,
            'room_type_id' => $roomTypeAttendanceDefault->id,
        ]);

        $roomAttendanceExpert1 = Room::factory()->create([
            'expert_mode' => true,
            'record_attendance' => true,
            'room_type_id' => $roomTypeNoAttendanceDefault->id,
        ]);
        $roomAttendanceExpert2 = Room::factory()->create([
            'expert_mode' => true,
            'record_attendance' => true,
            'room_type_id' => $roomTypeAttendanceDefault->id,
        ]);
        $roomNoAttendanceEnforced1 = Room::factory()->create([
            'expert_mode' => true,
            'record_attendance' => true,
            'room_type_id' => $roomTypeNoAttendanceEnforced->id,
        ]);
        $roomNoAttendanceEnforced2 = Room::factory()->create([
            'expert_mode' => true,
            'record_attendance' => false,
            'room_type_id' => $roomTypeNoAttendanceEnforced->id,
        ]);
        $roomNoAttendanceEnforced3 = Room::factory()->create([
            'expert_mode' => false,
            'room_type_id' => $roomTypeNoAttendanceEnforced->id,
        ]);
        $roomNoAttendanceDefault = Room::factory()->create([
            'expert_mode' => false,
            'room_type_id' => $roomTypeNoAttendanceDefault->id,
            'record_attendance' => true,
        ]);
        $roomNoAttendanceExpert1 = Room::factory()->create([
            'expert_mode' => true,
            'room_type_id' => $roomTypeAttendanceDefault->id,
            'record_attendance' => false,
        ]);
        $roomNoAttendanceExpert2 = Room::factory()->create([
            'expert_mode' => true,
            'room_type_id' => $roomTypeNoAttendanceDefault->id,
            'record_attendance' => false,
        ]);

        $server = Server::factory()->create();
        $roomAttendanceEnforced1->roomType->serverPool->servers()->attach($server);
        $roomAttendanceEnforced2->roomType->serverPool->servers()->attach($server);
        $roomAttendanceEnforced3->roomType->serverPool->servers()->attach($server);
        $roomAttendanceDefault->roomType->serverPool->servers()->attach($server);
        $roomAttendanceExpert1->roomType->serverPool->servers()->attach($server);
        $roomAttendanceExpert2->roomType->serverPool->servers()->attach($server);
        $roomNoAttendanceEnforced1->roomType->serverPool->servers()->attach($server);
        $roomNoAttendanceEnforced2->roomType->serverPool->servers()->attach($server);
        $roomNoAttendanceEnforced3->roomType->serverPool->servers()->attach($server);
        $roomNoAttendanceDefault->roomType->serverPool->servers()->attach($server);
        $roomNoAttendanceExpert1->roomType->serverPool->servers()->attach($server);
        $roomNoAttendanceExpert2->roomType->serverPool->servers()->attach($server);

        // Create Fake BBB-Server
        $bbbfaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);

        // Create 12 meetings
        $bbbfaker->addCreateMeetingRequest();
        $bbbfaker->addCreateMeetingRequest();
        $bbbfaker->addCreateMeetingRequest();
        $bbbfaker->addCreateMeetingRequest();
        $bbbfaker->addCreateMeetingRequest();
        $bbbfaker->addCreateMeetingRequest();
        $bbbfaker->addCreateMeetingRequest();
        $bbbfaker->addCreateMeetingRequest();
        $bbbfaker->addCreateMeetingRequest();
        $bbbfaker->addCreateMeetingRequest();
        $bbbfaker->addCreateMeetingRequest();
        $bbbfaker->addCreateMeetingRequest();

        // Create meeting attendance enforced expert mode activated (room setting false)
        $this->actingAs($roomAttendanceEnforced1->owner)->postJson(route('api.v1.rooms.start', ['room' => $roomAttendanceEnforced1]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Create meeting attendance enforced expert mode activated (room setting true)
        $this->actingAs($roomAttendanceEnforced2->owner)->postJson(route('api.v1.rooms.start', ['room' => $roomAttendanceEnforced2]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Create meeting attendance enforced expert mode deactivated
        $this->actingAs($roomAttendanceEnforced3->owner)->postJson(route('api.v1.rooms.start', ['room' => $roomAttendanceEnforced3]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        //Create meeting attendance default
        $this->actingAs($roomAttendanceDefault->owner)->postJson(route('api.v1.rooms.start', ['room' => $roomAttendanceDefault]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        //Create meeting attendance expert (room type default false)
        $this->actingAs($roomAttendanceExpert1->owner)->postJson(route('api.v1.rooms.start', ['room' => $roomAttendanceExpert1]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        //Create meeting attendance expert (room type default true)
        $this->actingAs($roomAttendanceExpert2->owner)->postJson(route('api.v1.rooms.start', ['room' => $roomAttendanceExpert2]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Create meeting with no attendance enforced expert mode activated (room setting true)
        $this->actingAs($roomNoAttendanceEnforced1->owner)->postJson(route('api.v1.rooms.start', ['room' => $roomNoAttendanceEnforced1]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Create meeting with no attendance enforced expert mode activated (room setting false)
        $this->actingAs($roomNoAttendanceEnforced2->owner)->postJson(route('api.v1.rooms.start', ['room' => $roomNoAttendanceEnforced2]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Create meeting with no attendance enforced expert mode deactivated
        $this->actingAs($roomNoAttendanceEnforced3->owner)->postJson(route('api.v1.rooms.start', ['room' => $roomNoAttendanceEnforced3]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Create meeting with no attendance default
        $this->actingAs($roomNoAttendanceDefault->owner)->postJson(route('api.v1.rooms.start', ['room' => $roomNoAttendanceDefault]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Create meeting with no attendance expert (room type default true)
        $this->actingAs($roomNoAttendanceExpert1->owner)->postJson(route('api.v1.rooms.start', ['room' => $roomNoAttendanceExpert1]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Create meeting with no attendance expert (room type default false)
        $this->actingAs($roomNoAttendanceExpert2->owner)->postJson(route('api.v1.rooms.start', ['room' => $roomNoAttendanceExpert2]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // check correct record attendance after start
        $roomAttendanceEnforced1->refresh();
        $roomAttendanceEnforced2->refresh();
        $roomAttendanceEnforced3->refresh();
        $roomAttendanceDefault->refresh();
        $roomAttendanceExpert1->refresh();
        $roomAttendanceExpert2->refresh();
        $roomNoAttendanceEnforced1->refresh();
        $roomNoAttendanceEnforced2->refresh();
        $roomNoAttendanceEnforced3->refresh();
        $roomNoAttendanceDefault->refresh();
        $roomNoAttendanceExpert1->refresh();
        $roomNoAttendanceExpert2->refresh();
        $this->assertTrue($roomAttendanceEnforced1->latestMeeting->record_attendance);
        $this->assertTrue($roomAttendanceEnforced2->latestMeeting->record_attendance);
        $this->assertTrue($roomAttendanceEnforced3->latestMeeting->record_attendance);
        $this->assertTrue($roomAttendanceDefault->latestMeeting->record_attendance);
        $this->assertTrue($roomAttendanceExpert1->latestMeeting->record_attendance);
        $this->assertTrue($roomAttendanceExpert2->latestMeeting->record_attendance);
        $this->assertFalse($roomNoAttendanceEnforced1->latestMeeting->record_attendance);
        $this->assertFalse($roomNoAttendanceEnforced2->latestMeeting->record_attendance);
        $this->assertFalse($roomNoAttendanceEnforced3->latestMeeting->record_attendance);
        $this->assertFalse($roomNoAttendanceDefault->latestMeeting->record_attendance);
        $this->assertFalse($roomNoAttendanceExpert1->latestMeeting->record_attendance);
        $this->assertFalse($roomNoAttendanceExpert2->latestMeeting->record_attendance);

        // check if api return the record attendance status of the currently running meeting, not the room
        $roomAttendanceExpert1->record_attendance = false;
        $roomAttendanceExpert1->save();
        $roomNoAttendanceExpert1->record_attendance = true;
        $roomNoAttendanceExpert1->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $roomAttendanceExpert1]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => true,
            ])
            ->assertJsonPath('last_meeting.end', null);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $roomNoAttendanceExpert1]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => false,
            ])
            ->assertJsonPath('last_meeting.end', null);

        // Test changing of the room type settings while running meeting
        $roomAttendanceExpert2->roomType->record_attendance_enforced = true;
        $roomAttendanceExpert2->roomType->record_attendance_default = false;
        $roomAttendanceExpert2->roomType->save();
        $roomNoAttendanceExpert2->roomType->record_attendance_enforced = true;
        $roomNoAttendanceExpert2->roomType->record_attendance_default = true;
        $roomNoAttendanceExpert2->roomType->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $roomAttendanceExpert2]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => true,
            ]);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $roomNoAttendanceExpert2]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => false,
            ]);

        // Test changing of the room type while running meeting

        $roomAttendanceDefault->roomType()->associate($roomTypeNoAttendanceEnforced);
        $roomNoAttendanceDefault->save();
        $roomNoAttendanceDefault->roomType()->associate($roomTypeAttendanceEnforced);
        $roomNoAttendanceDefault->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $roomAttendanceDefault]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => true,
            ]);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $roomNoAttendanceDefault]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => false,
            ]);

    }

    /**
     * Tests if record is set on start
     */
    public function testStartRecordStatus()
    {
        $server = Server::factory()->create();

        // Create Fake BBB-Server
        $bbbFaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);

        // Check record status on starting a room with recording disabled in expert mode, room type enabled but not enforced
        $room = Room::factory()->create(['record' => false, 'expert_mode' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->record_default = true;
        $room->roomType->record_enforced = false;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $room->refresh();
        $meeting = $room->latestMeeting;
        $this->assertFalse($meeting->record);

        // Check record status on starting a room with recording disabled in expert mode, room type enabled and enforced
        $room = Room::factory()->create(['record' => false, 'expert_mode' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->record_default = true;
        $room->roomType->record_enforced = true;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => true, 'consent_record_video' => false])
            ->assertSuccessful();
        $room->refresh();
        $meeting = $room->latestMeeting;
        $this->assertTrue($meeting->record);

        // Check record status on starting a room with recording disabled without expert mode, room type enabled but not enforced
        $room = Room::factory()->create(['record' => false, 'expert_mode' => false]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->record_default = true;
        $room->roomType->record_enforced = false;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => true, 'consent_record_video' => false])
            ->assertSuccessful();
        $room->refresh();
        $meeting = $room->latestMeeting;
        $this->assertTrue($meeting->record);

        // Check record status on starting a room with recording enabled in expert mode, room type disabled but not enforced
        $room = Room::factory()->create(['record' => true, 'expert_mode' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->record_default = false;
        $room->roomType->record_enforced = false;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => true, 'consent_record_video' => false])
            ->assertSuccessful();
        $room->refresh();
        $meeting = $room->latestMeeting;
        $this->assertTrue($meeting->record);

        // Check record status on starting a room with recording enabled in expert mode, room type disabled and enforced
        $room = Room::factory()->create(['record' => true, 'expert_mode' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->record_default = false;
        $room->roomType->record_enforced = true;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $room->refresh();
        $meeting = $room->latestMeeting;
        $this->assertFalse($meeting->record);

        // Check record status on starting a room with recording enabled without expert mode, room type disabled but not enforced
        $room = Room::factory()->create(['record' => true, 'expert_mode' => false]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->record_default = false;
        $room->roomType->record_enforced = false;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $room->refresh();
        $meeting = $room->latestMeeting;
        $this->assertFalse($meeting->record);
    }

    /**
     * Tests if record parameter is validated according to the room and room type settings
     */
    public function testStartRecordParameter()
    {
        $server = Server::factory()->create();

        // Create Fake BBB-Server
        $bbbFaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);

        // Agree to record when room is set to record
        $room = Room::factory()->create(['record' => true, 'expert_mode' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->record_default = false;
        $room->roomType->record_enforced = false;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => true, 'consent_record_video' => false])
            ->assertSuccessful();

        // Don't agree when room is set to record
        $room = Room::factory()->create(['record' => true, 'expert_mode' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->record_default = false;
        $room->roomType->record_enforced = false;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertJsonValidationErrors(['consent_record']);

        // Agree to record when room is set to record but room type has recording disabled
        $room = Room::factory()->create(['record' => true, 'expert_mode' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->record_default = false;
        $room->roomType->record_enforced = true;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => true, 'consent_record_video' => false])
            ->assertSuccessful();

        // Don't agree when room is set to record but room type has recording disabled
        $room = Room::factory()->create(['record' => true, 'expert_mode' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->record_default = false;
        $room->roomType->record_enforced = true;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Don't agree when room is set to record but not expert and room type has recording disabled
        $room = Room::factory()->create(['record' => true, 'expert_mode' => false]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->record_default = false;
        $room->roomType->record_enforced = false;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Don't agree when room is set to record not record, not expert and room type has recording enabled
        $room = Room::factory()->create(['record' => true, 'expert_mode' => false]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->record_default = true;
        $room->roomType->record_enforced = false;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertJsonValidationErrors(['consent_record']);

        // Agree when room is not set to record
        $room = Room::factory()->create(['record' => false, 'expert_mode' => true]);
        $room->roomType->record_default = false;
        $room->roomType->record_enforced = false;
        $room->roomType->save();
        $room->roomType->serverPool->servers()->attach($server);
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => true, 'consent_record_video' => false])
            ->assertSuccessful();

        // Don't agree when room is not set to record
        $room = Room::factory()->create(['record' => false, 'expert_mode' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->record_default = false;
        $room->roomType->record_enforced = false;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Check error on invalid record value
        $room = Room::factory()->create(['record' => false, 'expert_mode' => true]);
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => 'hello', 'consent_record_video' => false])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['consent_record']);

        // Check error on missing record value
        $room = Room::factory()->create(['record' => false, 'expert_mode' => true]);
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record_video' => false])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['consent_record']);
    }

    /**
     * Tests if record video parameter is validated and passed to BBB in the join url on start
     */
    public function testStartRecordVideoParameter()
    {
        $server = Server::factory()->create();

        // Create Fake BBB-Server
        $bbbFaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);

        // Agree to record own video
        $room = Room::factory()->create(['record' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $bbbFaker->addCreateMeetingRequest();
        $result = $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => true, 'consent_record_video' => true]);
        $result->assertSuccessful();
        $joinUrl = $result->json('url');
        $this->assertStringContainsString('userdata-bbb_record_video=true', $joinUrl);

        // Don't record own video
        $room = Room::factory()->create(['record' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $bbbFaker->addCreateMeetingRequest();
        $result = $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => true, 'consent_record_video' => false]);
        $result->assertSuccessful();
        $joinUrl = $result->json('url');
        $this->assertStringContainsString('userdata-bbb_record_video=false', $joinUrl);

        // Check error on invalid record video value
        $room = Room::factory()->create(['record' => false]);
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => 'hello'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['consent_record_video']);

        // Check error on missing record video value
        $room = Room::factory()->create(['record' => false]);
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['consent_record_video']);
    }

    /**
     * Test joining a meeting with a running bbb server
     */
    public function testJoin()
    {
        $room = Room::factory()->create([
            'allow_guests' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
            'expert_mode' => true,
            'record_attendance' => true,
        ]);
        $room->owner->update(['bbb_skip_check_audio' => true]);

        $server = Server::factory()->create();
        $room->roomType->serverPool->servers()->attach($server);

        // Create Fake BBB-Server
        $bbbfaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);
        // Meeting not running
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../../../Fixtures/MeetingNotFound.xml')));
        // Create meeting
        $bbbfaker->addCreateMeetingRequest();
        // Get meeting info 10 times
        $meetingInfoRequest = function (Request $request) {
            $uri = $request->toPsrRequest()->getUri();
            parse_str($uri->getQuery(), $params);
            $xml = '
                <response>
                    <returncode>SUCCESS</returncode>
                    <meetingName>test</meetingName>
                    <meetingID>'.$params['meetingID'].'</meetingID>
                    <internalMeetingID>5400b2af9176c1be733b9a4f1adbc7fb41a72123-1624606850899</internalMeetingID>
                    <createTime>1624606850899</createTime>
                    <createDate>Fri Jun 25 09:40:50 CEST 2021</createDate>
                    <voiceBridge>70663</voiceBridge>
                    <dialNumber>613-555-1234</dialNumber>
                    <running>true</running>
                    <duration>0</duration>
                    <hasUserJoined>true</hasUserJoined>
                    <recording>false</recording>
                    <hasBeenForciblyEnded>false</hasBeenForciblyEnded>
                    <startTime>1624606850956</startTime>
                    <endTime>0</endTime>
                    <participantCount>0</participantCount>
                    <listenerCount>0</listenerCount>
                    <voiceParticipantCount>0</voiceParticipantCount>
                    <videoCount>0</videoCount>
                    <maxUsers>0</maxUsers>
                    <moderatorCount>0</moderatorCount>
                    <isBreakout>false</isBreakout>
                </response>';

            return Http::response($xml);
        };
        for ($i = 0; $i < 11; $i++) {
            $bbbfaker->addRequest($meetingInfoRequest);
        }

        // Testing join with meeting not running
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::ROOM_NOT_RUNNING->value);

        // Testing join with meeting that is starting, but not ready yet
        $meeting = $room->meetings()->create();
        $meeting->server()->associate($server);
        $meeting->save();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::ROOM_NOT_RUNNING->value);
        $meeting->delete();

        // Check no request was send to the bbb server
        $this->assertNull($bbbfaker->getRequest(0));

        // Test to join a meeting marked in the db as running, but isn't running on the server
        $meeting = $room->meetings()->create();
        $meeting->start = date('Y-m-d H:i:s');
        $meeting->server()->associate($server);
        $meeting->save();
        $room->latestMeeting()->associate($meeting);
        $room->save();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::ROOM_NOT_RUNNING->value);
        $meeting->refresh();
        $this->assertNotNull($meeting->end);

        // Check request was send to the bbb server
        $this->assertEquals('/bigbluebutton/api/getMeetingInfo', $bbbfaker->getRequest(0)->toPsrRequest()->getUri()->getPath());

        // Start meeting
        $response = $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $this->assertIsString($response->json('url'));
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('true', $queryParams['userdata-bbb_skip_check_audio']);

        \Auth::logout();

        // Check if room is running
        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertSuccessful()
            ->assertJsonPath('latest_meeting.end', null);

        // Join as guest, without required access code
        $this->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertForbidden();

        // Join as guest without name
        $this->withHeaders(['Access-Code' => $room->access_code])->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertJsonValidationErrors('name');

        // Join as guest with invalid/dangerous name
        $this->withHeaders(['Access-Code' => $room->access_code])->postJson(route('api.v1.rooms.join', ['room' => $room]), ['name' => '<script>alert("HI");</script>', 'consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertJsonValidationErrors('name')
            ->assertJsonFragment([
                'errors' => [
                    'name' => [
                        'Name contains the following non-permitted characters: <>";',
                    ],
                ],
            ]);

        // Join as guest
        $response = $this->withHeaders(['Access-Code' => $room->access_code])->postJson(route('api.v1.rooms.join', ['room' => $room]), ['name' => $this->faker->name, 'consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('false', $queryParams['userdata-bbb_skip_check_audio']);

        $this->flushHeaders();

        // Join token moderator
        Auth::logout();

        $moderatorToken = RoomToken::factory()->create([
            'room_id' => $room->id,
            'role' => RoomUserRole::MODERATOR,
            'firstname' => 'John',
            'lastname' => 'Doe',
        ]);

        $response = $this->withHeaders(['Token' => $moderatorToken->token])
            ->postJson(route('api.v1.rooms.join', ['room' => $room]), ['name' => 'Max Mustermann', 'consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals('John Doe', $params['fullName']);
        $this->flushHeaders();

        // Join token user
        $userToken = RoomToken::factory()->create([
            'room_id' => $room->id,
            'role' => RoomUserRole::USER,
            'firstname' => 'John',
            'lastname' => 'Doe',
        ]);

        $response = $this->withHeaders(['Token' => $userToken->token])
            ->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals('John Doe', $params['fullName']);
        $this->flushHeaders();

        // Join as authorized users with token
        $response = $this->actingAs($this->user)->withHeaders(['Access-Code' => $room->access_code, 'Token' => $userToken->token])
            ->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals($this->user->fullName, $params['fullName']);
        $this->flushHeaders();
        Auth::logout();

        // Join as authorized users
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertUnauthorized();
        $this->withHeaders(['Access-Code' => $room->access_code])->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        $this->flushHeaders();

        // Testing owner
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Testing member
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Not accepting attendance recording, but meeting is recorded
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertJsonValidationErrors(['consent_record_attendance']);

        // Not accepting attendance recording, but meeting is not recorded
        $room->refresh();
        $runningMeeting = $room->latestMeeting;
        $runningMeeting->record_attendance = false;
        $runningMeeting->save();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Not accepting attendance recording, but room attendance is disabled
        $runningMeeting->record_attendance = true;
        $runningMeeting->save();
        $room->record_attendance = false;
        $room->save();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertJsonValidationErrors(['consent_record_attendance']);

        // Not accepting attendance recording, but room type rec. attendance is disabled
        $room->record_attendance = true;
        $room->save();
        $room->roomType->record_attendance_default = false;
        $room->roomType->record_attendance_enforced = true;
        $room->roomType->save();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertJsonValidationErrors(['consent_record_attendance']);

        // Check with invalid values for record_attendance parameter
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => 'test', 'consent_record' => false, 'consent_record_video' => false])
            ->assertJsonValidationErrors(['consent_record_attendance']);
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]))
            ->assertJsonValidationErrors(['consent_record_attendance']);
    }

    /**
     * Test joining a meeting with a server error in BBB
     */
    public function testJoinServerError()
    {
        Http::fake([
            'test.notld/bigbluebutton/api/getMeetingInfo*' => Http::response('Error', 500),
        ]);

        $meeting = Meeting::factory(['id' => '409e94ee-e317-4040-8cb2-8000a289b49d', 'end' => null])->create();
        $meeting->room->latestMeeting()->associate($meeting);
        $meeting->room->save();

        $this->assertEquals(ServerHealth::ONLINE, $meeting->server->health);

        $this->actingAs($meeting->room->owner)->postJson(route('api.v1.rooms.join', ['room' => $meeting->room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertStatus(CustomStatusCodes::JOIN_FAILED->value);

        $meeting->server->refresh();
        $this->assertEquals(ServerHealth::ONLINE, $meeting->server->health);
    }

    /**
     * Test joining urls contains correct role and name
     */
    public function testJoinUrl()
    {
        $room = Room::factory()->create([
            'allow_guests' => true,
        ]);

        $this->bigBlueButtonSettings->style = url('style.css');
        $this->bigBlueButtonSettings->save();

        // Set user profile image
        $this->user->image = 'test.jpg';
        $this->user->save();

        $server = Server::factory()->create();
        $room->roomType->serverPool->servers()->attach($server);

        // Create Fake BBB-Server
        $bbbfaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);
        // Create meeting
        $bbbfaker->addCreateMeetingRequest();
        // Get meeting info 8 times
        $meetingInfoRequest = function (Request $request) {
            $uri = $request->toPsrRequest()->getUri();
            parse_str($uri->getQuery(), $params);
            $xml = '
                <response>
                    <returncode>SUCCESS</returncode>
                    <meetingName>test</meetingName>
                    <meetingID>'.$params['meetingID'].'</meetingID>
                    <internalMeetingID>5400b2af9176c1be733b9a4f1adbc7fb41a72123-1624606850899</internalMeetingID>
                    <createTime>1624606850899</createTime>
                    <createDate>Fri Jun 25 09:40:50 CEST 2021</createDate>
                    <voiceBridge>70663</voiceBridge>
                    <dialNumber>613-555-1234</dialNumber>
                    <running>true</running>
                    <duration>0</duration>
                    <hasUserJoined>true</hasUserJoined>
                    <recording>false</recording>
                    <hasBeenForciblyEnded>false</hasBeenForciblyEnded>
                    <startTime>1624606850956</startTime>
                    <endTime>0</endTime>
                    <participantCount>0</participantCount>
                    <listenerCount>0</listenerCount>
                    <voiceParticipantCount>0</voiceParticipantCount>
                    <videoCount>0</videoCount>
                    <maxUsers>0</maxUsers>
                    <moderatorCount>0</moderatorCount>
                    <isBreakout>false</isBreakout>
                </response>';

            return Http::response($xml);
        };
        for ($i = 0; $i < 8; $i++) {
            $bbbfaker->addRequest($meetingInfoRequest);
        }

        // Start meeting
        $response = $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $runningMeeting = $room->latestMeeting;

        \Auth::logout();

        // Join as guest
        $guestName = $this->faker->name;
        $response = $this->postJson(route('api.v1.rooms.join', ['room' => $room]), ['name' => $guestName, 'consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('VIEWER', $queryParams['role']);
        $this->assertEquals('true', $queryParams['guest']);
        $this->assertEquals($guestName, $queryParams['fullName']);

        // check bbb style url
        $this->assertEquals(url('style.css'), $queryParams['userdata-bbb_custom_style_url']);

        $this->bigBlueButtonSettings->style = null;
        $this->bigBlueButtonSettings->save();

        // Join as authorized users
        $response = $this->actingAs($this->user)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('VIEWER', $queryParams['role']);
        $this->assertEquals($this->user->fullname, $queryParams['fullName']);
        // Check if avatarURL is set, if profile image exists
        $this->assertEquals($this->user->imageUrl, $queryParams['avatarURL']);
        // check bbb style url missing if not set
        $this->assertArrayNotHasKey('userdata-bbb_custom_style_url', $queryParams);

        // Testing owner
        $response = $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('MODERATOR', $queryParams['role']);
        // Check if avatarURL empty, if no profile image is set
        $this->assertFalse(isset($queryParams['avatarURL']));

        // Testing member user
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::USER]]);
        $response = $this->actingAs($this->user)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('VIEWER', $queryParams['role']);

        // Testing member moderator
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $response = $this->actingAs($this->user)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('MODERATOR', $queryParams['role']);

        // Testing member co-owner
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $response = $this->actingAs($this->user)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('MODERATOR', $queryParams['role']);

        // Reset room membership
        $room->members()->sync([]);

        // Testing with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $response = $this->actingAs($this->user)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('VIEWER', $queryParams['role']);
        $this->role->permissions()->detach($this->viewAllPermission);

        // Testing with manage rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->managePermission);
        $response = $this->actingAs($this->user)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => true, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('MODERATOR', $queryParams['role']);
        $this->role->permissions()->detach($this->managePermission);
    }

    /**
     * Tests if record parameter is validated based on the current running meeting
     */
    public function testJoinRecordParameter()
    {
        $server = Server::factory()->create();

        // Create Fake BBB-Server
        $bbbFaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);

        // Fake meeting info request to simulate running meeting
        $meetingInfoRequest = function (Request $request) {
            $uri = $request->toPsrRequest()->getUri();
            parse_str($uri->getQuery(), $params);
            $xml = '
                <response>
                    <returncode>SUCCESS</returncode>
                    <meetingName>test</meetingName>
                    <meetingID>'.$params['meetingID'].'</meetingID>
                    <internalMeetingID>5400b2af9176c1be733b9a4f1adbc7fb41a72123-1624606850899</internalMeetingID>
                    <createTime>1624606850899</createTime>
                    <createDate>Fri Jun 25 09:40:50 CEST 2021</createDate>
                    <voiceBridge>70663</voiceBridge>
                    <dialNumber>613-555-1234</dialNumber>
                    <running>true</running>
                    <duration>0</duration>
                    <hasUserJoined>true</hasUserJoined>
                    <recording>false</recording>
                    <hasBeenForciblyEnded>false</hasBeenForciblyEnded>
                    <startTime>1624606850956</startTime>
                    <endTime>0</endTime>
                    <participantCount>0</participantCount>
                    <listenerCount>0</listenerCount>
                    <voiceParticipantCount>0</voiceParticipantCount>
                    <videoCount>0</videoCount>
                    <maxUsers>0</maxUsers>
                    <moderatorCount>0</moderatorCount>
                    <isBreakout>false</isBreakout>
                </response>';

            return Http::response($xml);
        };

        // Start meeting with recording enabled
        $room = Room::factory()->create(['record' => true, 'expert_mode' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->record_default = false;
        $room->roomType->record_enforced = false;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => true, 'consent_record_video' => false])
            ->assertSuccessful();

        // Agree to record when meeting was started with record
        $bbbFaker->addRequest($meetingInfoRequest);
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => true, 'consent_record_video' => false])
            ->assertSuccessful();

        // Don't agree when meeting was started with record
        $bbbFaker->addRequest($meetingInfoRequest);
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertJsonValidationErrors(['consent_record']);

        // Change room setting to disable recording
        // should not have any effect on the current meeting
        $room->record = false;
        $room->save();

        // Check if agreement is still required, as the meeting is still running with recording enabled
        $bbbFaker->addRequest($meetingInfoRequest);
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertJsonValidationErrors(['consent_record']);

        // Create new meeting with recording disabled
        $room = Room::factory()->create(['record' => false, 'expert_mode' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->record_default = false;
        $room->roomType->record_enforced = false;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => true, 'consent_record_video' => false])
            ->assertSuccessful();

        // Agree when meeting was started without record
        $bbbFaker->addRequest($meetingInfoRequest);
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => true, 'consent_record_video' => false])
            ->assertSuccessful();

        // Don't agree when meeting was started without record
        $bbbFaker->addRequest($meetingInfoRequest);
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Change room setting to enable recording
        // should not have any effect on the current meeting
        $room->record = true;
        $room->save();

        // Check if agreement is still not required, as the meeting is still running with recording disabled
        $bbbFaker->addRequest($meetingInfoRequest);
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Check error on invalid record value
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => 'hello', 'consent_record_video' => false])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['consent_record']);

        // Check error on missing record value
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record_video' => false])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['consent_record']);
    }

    /**
     * Tests if record video parameter is validated and passed to BBB in the join url on join
     */
    public function testJoinRecordVideoParameter()
    {
        $server = Server::factory()->create();

        // Create Fake BBB-Server
        $bbbFaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);

        // Fake meeting info request to simulate running meeting
        $meetingInfoRequest = function (Request $request) {
            $uri = $request->toPsrRequest()->getUri();
            parse_str($uri->getQuery(), $params);
            $xml = '
                <response>
                    <returncode>SUCCESS</returncode>
                    <meetingName>test</meetingName>
                    <meetingID>'.$params['meetingID'].'</meetingID>
                    <internalMeetingID>5400b2af9176c1be733b9a4f1adbc7fb41a72123-1624606850899</internalMeetingID>
                    <createTime>1624606850899</createTime>
                    <createDate>Fri Jun 25 09:40:50 CEST 2021</createDate>
                    <voiceBridge>70663</voiceBridge>
                    <dialNumber>613-555-1234</dialNumber>
                    <running>true</running>
                    <duration>0</duration>
                    <hasUserJoined>true</hasUserJoined>
                    <recording>false</recording>
                    <hasBeenForciblyEnded>false</hasBeenForciblyEnded>
                    <startTime>1624606850956</startTime>
                    <endTime>0</endTime>
                    <participantCount>0</participantCount>
                    <listenerCount>0</listenerCount>
                    <voiceParticipantCount>0</voiceParticipantCount>
                    <videoCount>0</videoCount>
                    <maxUsers>0</maxUsers>
                    <moderatorCount>0</moderatorCount>
                    <isBreakout>false</isBreakout>
                </response>';

            return Http::response($xml);
        };

        // Start meeting with recording enabled
        $room = Room::factory()->create(['record' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => true, 'consent_record_video' => false])
            ->assertSuccessful();

        // Agree to record own video
        $bbbFaker->addRequest($meetingInfoRequest);
        $result = $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => true, 'consent_record_video' => true]);
        $result->assertSuccessful();
        $joinUrl = $result->json('url');
        $this->assertStringContainsString('userdata-bbb_record_video=true', $joinUrl);

        // Don't record own video
        $bbbFaker->addRequest($meetingInfoRequest);
        $result = $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => true, 'consent_record_video' => false]);
        $result->assertSuccessful();
        $joinUrl = $result->json('url');
        $this->assertStringContainsString('userdata-bbb_record_video=false', $joinUrl);

        // Check error on invalid record video value
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => 'hello'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['consent_record_video']);

        // Check error on missing record video value
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.join', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['consent_record_video']);
    }
}
