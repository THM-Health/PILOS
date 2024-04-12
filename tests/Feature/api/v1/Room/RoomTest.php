<?php

namespace Tests\Feature\api\v1\Room;

use App\Enums\CustomStatusCodes;
use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Enums\ServerHealth;
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
use Tests\TestCase;
use Tests\Utils\BigBlueButtonServerFaker;

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
     * Setup ressources for all tests
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
        setting(['room_limit' => '-1']);

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
        setting(['room_limit' => '1']);

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
        setting(['room_limit' => '1']);

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
        $room = Room::factory()->create([
            'allow_guests' => true,
        ]);
        $this->getJson(route('api.v1.rooms.show', ['room' => $room]))
            ->assertStatus(200)
            ->assertJsonFragment(['current_user' => null]);
    }

    /**
     * Test if guests are prevented from accessing room
     */
    public function testDisableGuestAccess()
    {
        $room = Room::factory()->create();
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
                        'allow_listing' => $room->roomType->allow_listing,
                        'model_name' => 'RoomType',
                        'updated_at' => $room->roomType->updated_at->toJSON(),
                    ],
                    'model_name' => 'Room',
                    'short_description' => $room->short_description,
                    'is_favorite' => false,
                    'authenticated' => true,
                    'allow_membership' => $room->allow_membership,
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
        setting(['room_pagination_page_size' => 10]);

        $roomType1 = RoomType::factory()->create();
        $roomType2 = RoomType::factory()->create(['allow_listing' => false]);
        $roomType3 = RoomType::factory()->create(['allow_listing' => true]);

        $roomOwn = Room::factory()->create(['name' => 'Own room', 'room_type_id' => $roomType1->id, 'listed' => false, 'access_code' => null]);
        $roomOwn->owner()->associate($this->user);
        $roomOwn->save();
        $roomShared = Room::factory()->create(['name' => 'Shared room', 'room_type_id' => $roomType1->id, 'listed' => false, 'access_code' => null]);
        $roomShared->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $roomPublic = Room::factory()->create(['name' => 'Public room', 'room_type_id' => $roomType3->id, 'listed' => true, 'access_code' => null]);
        $roomAll1 = Room::factory()->create(['name' => 'Room all 1', 'room_type_id' => $roomType2->id, 'listed' => true, 'access_code' => 123456789]);
        $roomAll2 = Room::factory()->create(['name' => 'Room all 2', 'room_type_id' => $roomType2->id, 'listed' => true, 'access_code' => null]);

        $server = Server::factory()->create();
        $meeting1 = $roomAll2->meetings()->create();
        $meeting1->server()->associate($server);
        $meeting1->start = date('Y-m-d H:i:s');
        $meeting1->save();
        $roomAll2->latestMeeting()->associate($meeting1);
        $roomAll2->save();

        // Testing guests access
        $this->getJson(route('api.v1.rooms.index'))->assertUnauthorized();

        //Test without filter
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?only_favorites=0&sort_by=last_started&page=1')
            ->assertJsonValidationErrors(['filter_own', 'filter_shared', 'filter_public', 'filter_all']);

        //Test with logged in user
        //filter own
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=0&filter_all=0&only_favorites=0&sort_by=last_started&page=1')
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
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=0&filter_shared=1&filter_public=0&filter_all=0&only_favorites=0&sort_by=last_started&page=1')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id' => $roomShared->id, 'name' => $roomShared->name])
            ->assertJsonPath('meta.total_no_filter', 1)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //filter public
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=0&filter_shared=0&filter_public=1&filter_all=0&only_favorites=0&sort_by=last_started&page=1')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id' => $roomPublic->id, 'name' => $roomPublic->name])
            ->assertJsonPath('meta.total_no_filter', 1)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //filter own, shared
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=0&filter_all=0&only_favorites=0&sort_by=last_started&page=1')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name])
            ->assertJsonFragment(['id' => $roomShared->id, 'name' => $roomShared->name])
            ->assertJsonPath('meta.total_no_filter', 2)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //filter shared, public
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=0&filter_shared=1&filter_public=1&filter_all=0&only_favorites=0&sort_by=last_started&page=1')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $roomShared->id, 'name' => $roomShared->name])
            ->assertJsonFragment(['id' => $roomPublic->id, 'name' => $roomPublic->name])
            ->assertJsonPath('meta.total_no_filter', 2)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //filter own, public
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=1&filter_all=0&only_favorites=0&sort_by=last_started&page=1')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name])
            ->assertJsonFragment(['id' => $roomPublic->id, 'name' => $roomPublic->name])
            ->assertJsonPath('meta.total_no_filter', 2)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //filter own, shared, public
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=0&only_favorites=0&sort_by=last_started&page=1')
            ->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name])
            ->assertJsonFragment(['id' => $roomShared->id, 'name' => $roomShared->name])
            ->assertJsonFragment(['id' => $roomPublic->id, 'name' => $roomPublic->name])
            ->assertJsonPath('meta.total_no_filter', 3)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //Test Favorites

        //Test without only_favorites
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=1&filter_all=0&sort_by=last_started&page=1')
            ->assertJsonValidationErrors(['only_favorites']);

        //Test Room List with only favorites (user has no favorites)
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=1&filter_all=0&only_favorites=1&sort_by=last_started&page=1')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        //Test Room List with only favorites (user has favorites)
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.favorites.add', ['room' => $roomOwn]))
            ->assertNoContent();

        $this->user->refresh();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=0&only_favorites=1&sort_by=last_started&page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name]);

        //Test Room List with only favorites (user has several favorites)
        $this->user->roomFavorites()->attach($roomShared);
        $this->user->roomFavorites()->attach($roomPublic);
        $this->user->roomFavorites()->attach($roomAll1);

        $this->user->refresh();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=0&filter_all=1&only_favorites=1&sort_by=last_started&page=1')
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name])
            ->assertJsonFragment(['id' => $roomShared->id, 'name' => $roomShared->name])
            ->assertJsonFragment(['id' => $roomPublic->id, 'name' => $roomPublic->name])
            ->assertJsonFragment(['id' => $roomAll1->id, 'name' => $roomAll1->name]);

        //filter all (without permission to show all rooms)
        //should lead to bad request because the other filters are set to 0 (false)
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=0&filter_shared=0&filter_public=0&filter_all=1&only_favorites=0&sort_by=last_started&page=1')
            ->assertBadRequest();

        //should show same result as showing all the other filters together
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1')
            ->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name])
            ->assertJsonFragment(['id' => $roomShared->id, 'name' => $roomShared->name])
            ->assertJsonFragment(['id' => $roomPublic->id, 'name' => $roomPublic->name])
            ->assertJsonPath('meta.total_no_filter', 3)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //filter all (with permission to show all rooms)
        //should show all rooms
        $role = Role::factory()->create();
        $role->permissions()->attach($this->viewAllPermission);
        $this->user->roles()->attach($role);
        $results = $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1')
            ->assertStatus(200)
            ->assertJsonCount(5, 'data')
            ->assertJsonFragment(['id' => $roomOwn->id, 'name' => $roomOwn->name])
            ->assertJsonFragment(['id' => $roomShared->id, 'name' => $roomShared->name])
            ->assertJsonFragment(['id' => $roomPublic->id, 'name' => $roomPublic->name])
            ->assertJsonFragment(['id' => $roomAll1->id, 'name' => $roomAll1->name])
            ->assertJsonFragment(['id' => $roomAll2->id, 'name' => $roomAll2->name])
            ->assertJsonPath('meta.total_no_filter', 5)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        foreach ($results->json('data') as $room) {
            if ($room['id'] == $roomAll2->id) {
                self::assertNull($room['last_meeting']['end']);
            } else {
                self::assertNull($room['last_meeting']);
            }
        }

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=0&filter_shared=0&filter_public=0&filter_all=1&only_favorites=0&sort_by=last_started&page=1')
            ->assertStatus(200)
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.total_no_filter', 5)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');

        //filter all (with permission to show all rooms) but with room type
        //should show all rooms with the given room type
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&room_type='.$roomType2->id.'&sort_by=last_started&page=1')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $roomAll1->id, 'name' => $roomAll1->name])
            ->assertJsonFragment(['id' => $roomAll2->id, 'name' => $roomAll2->name])
            ->assertJsonPath('meta.total_no_filter', 5)
            ->assertJsonPath('meta.total_own', 1)
            ->assertJsonCount(10, 'meta');
    }

    public function testRoomListSorting()
    {
        setting(['room_pagination_page_size' => 10]);

        $server = Server::factory()->create();
        $roomType1 = RoomType::factory()->create(['name' => 'roomType1']);
        $roomType2 = RoomType::factory()->create(['name' => 'roomType2']);
        $roomType3 = RoomType::factory()->create(['name' => 'roomType3']);
        $roomRunning1 = Room::factory()->create(['name' => 'Runnning room 1', 'room_type_id' => $roomType1->id]);
        $roomRunning1->owner()->associate($this->user);
        $meetingRunning1 = Meeting::factory()->create(['room_id' => $roomRunning1->id, 'start' => '2000-01-01 11:11:00', 'end' => null, 'server_id' => $server->id]);
        $roomRunning1->latestMeeting()->associate($meetingRunning1);
        $roomRunning1->save();

        $roomRunning2 = Room::factory()->create(['name' => 'Runnning room 2', 'room_type_id' => $roomType3->id]);
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
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=0&filter_all=0&only_favorites=0&page=1')
            ->assertJsonValidationErrors(['sort_by']);

        //with invalid sorting option
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=0&filter_all=0&only_favorites=0&sort_by=invalid_option&page=1')
            ->assertJsonValidationErrors(['sort_by']);

        //last started
        $results = $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=0&filter_all=0&only_favorites=0&sort_by=last_started&page=1')
            ->assertStatus(200)
            ->assertJsonCount(6, 'data');

        $this->assertEquals($roomRunning2->id, $results->json('data')[0]['id']);
        $this->assertEquals($roomRunning1->id, $results->json('data')[1]['id']);
        $this->assertEquals($roomLastStarted->id, $results->json('data')[2]['id']);
        $this->assertEquals($roomLastEnded->id, $results->json('data')[3]['id']);
        $this->assertEquals($roomFirstStarted->id, $results->json('data')[4]['id']);
        $this->assertEquals($roomNeverStarted->id, $results->json('data')[5]['id']);

        //alphabetical
        $results = $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=0&filter_all=0&only_favorites=0&sort_by=alpha&page=1')
            ->assertStatus(200)
            ->assertJsonCount(6, 'data');

        $this->assertEquals($roomFirstStarted->id, $results->json('data')[0]['id']);
        $this->assertEquals($roomLastEnded->id, $results->json('data')[1]['id']);
        $this->assertEquals($roomLastStarted->id, $results->json('data')[2]['id']);
        $this->assertEquals($roomNeverStarted->id, $results->json('data')[3]['id']);
        $this->assertEquals($roomRunning1->id, $results->json('data')[4]['id']);
        $this->assertEquals($roomRunning2->id, $results->json('data')[5]['id']);

        //by room type
        $results = $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=0&filter_public=0&filter_all=0&only_favorites=0&sort_by=room_type&page=1')
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
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1')
            ->assertOk()
            ->assertJsonFragment(['id' => $room1->id])
            ->assertJsonFragment(['id' => $room2->id])
            ->assertJsonPath('meta.total_no_filter', 2);

        // Testing with empty query
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&search=')
            ->assertJsonValidationErrors('search');

        // Find by room name
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&search=Test')
            ->assertOk()
            ->assertJsonFragment(['id' => $room1->id])
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total_no_filter', 2);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&search=Test+a')
            ->assertOk()
            ->assertJsonFragment(['id' => $room1->id])
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total_no_filter', 2);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&search=Test+a+xyz')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // Find by owner name
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&search=john')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&search=john+d')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&search=john+d+xyz')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        //Find by owner name and room name
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&search=test+john')
            ->assertOk()
            ->assertJsonFragment(['id' => $room1->id])
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total_no_filter', 2);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter_own=1&filter_shared=1&filter_public=1&filter_all=1&only_favorites=0&sort_by=last_started&page=1&search=test+john+xyz')
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

    public function testUpdateSettings()
    {
        $room = Room::factory()->create();
        // Get current settings
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful();

        $settings = $response->json('data');

        $roomType = $this->faker->randomElement(RoomType::all());

        $settings['access_code'] = $this->faker->numberBetween(111111111, 999999999);
        $settings['allow_membership'] = $this->faker->boolean;
        $settings['everyone_can_start'] = true;
        $settings['lock_settings_disable_cam'] = $this->faker->boolean;
        $settings['lock_settings_disable_mic'] = $this->faker->boolean;
        $settings['lock_settings_disable_note'] = $this->faker->boolean;
        $settings['lock_settings_disable_private_chat'] = $this->faker->boolean;
        $settings['lock_settings_disable_public_chat'] = $this->faker->boolean;
        $settings['lock_settings_lock_on_join'] = $this->faker->boolean;
        $settings['lock_settings_hide_user_list'] = $this->faker->boolean;
        $settings['mute_on_start'] = $this->faker->boolean;
        $settings['webcams_only_for_moderator'] = $this->faker->boolean;
        $settings['default_role'] = $this->faker->randomElement([RoomUserRole::MODERATOR, RoomUserRole::USER]);
        $settings['allow_guests'] = $this->faker->boolean;
        $settings['lobby'] = $this->faker->randomElement(RoomLobby::cases());
        $settings['room_type'] = $roomType->id;
        $settings['name'] = RoomFactory::createValidRoomName();
        $settings['welcome'] = $this->faker->text;
        $settings['short_description'] = $this->faker->text(300);
        $settings['listed'] = $this->faker->boolean;
        $settings['record_attendance'] = $this->faker->boolean;

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

        // Get new settings
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful();

        $new_settings = $response->json('data');
        $settings['room_type'] = new \App\Http\Resources\RoomType($roomType);

        $this->assertJsonStringEqualsJsonString(json_encode($new_settings), json_encode($settings));
    }

    public function testUpdateSettingsInvalid()
    {
        $room = Room::factory()->create();
        // Get current settings
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room' => $room]))
            ->assertSuccessful();

        $settings = $response->json('data');

        // Room type invalid format
        $settings['room_type'] = ['id' => 5];
        $this->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertJsonValidationErrors(['room_type']);

        // Name too short
        $settings['name'] = 'A';
        $settings['room_type'] = $this->faker->randomElement(RoomType::pluck('id'));
        $this->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertJsonValidationErrors(['name']);

        $settings['access_code'] = $this->faker->numberBetween(1111111, 9999999);
        $settings['default_role'] = RoomUserRole::GUEST;
        $settings['lobby'] = 5;
        $settings['name'] = null;
        $settings['room_type'] = 0;

        $this->putJson(route('api.v1.rooms.update', ['room' => $room]), $settings)
            ->assertJsonValidationErrors(['access_code', 'default_role', 'lobby', 'name', 'room_type']);
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
        $this->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertForbidden();
        $this->flushHeaders();

        // Testing authorized users
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertForbidden();
        $this->flushHeaders();

        // Testing member
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertForbidden();

        // Testing member as moderator
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE->value);

        // Testing member as co-owner
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE->value);

        // Reset room membership
        $room->members()->sync([]);

        // Try with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Try with manage all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE->value);
        $this->role->permissions()->detach($this->managePermission);

        // Testing owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE->value);
    }

    /**
     * Testing to start room with guests allowed, and everyone can start but no server available
     */
    public function testStartNoServer()
    {
        $room = Room::factory()->create([
            'allow_guests' => true,
            'everyone_can_start' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
        ]);

        // Testing guests
        $this->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertUnauthorized();
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertJsonValidationErrors('name');
        // Join as guest with invalid/dangerous name
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.start', ['room' => $room, 'name' => '<script>alert("HI");</script>', 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertJsonValidationErrors('name')
            ->assertJsonFragment([
                'errors' => [
                    'name' => [
                        'Name contains the following non-permitted characters: <>(");',
                    ],
                ],
            ]);
        // Join as guest with invalid/dangerous name that contains non utf8 chars
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.start', ['room' => $room, 'name' => '§´`', 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertJsonValidationErrors('name')
            ->assertJsonFragment([
                'errors' => [
                    'name' => [
                        'Name contains non-permitted characters',
                    ],
                ],
            ]);

        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.start', ['room' => $room, 'name' => $this->faker->name, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE->value);

        $this->flushHeaders();

        // Testing authorized users
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertUnauthorized();
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE->value);

        $this->flushHeaders();

        // Testing owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE->value);

        // Testing member
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
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
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::ROOM_START_FAILED->value);

        $server->refresh();
        $this->assertEquals(ServerHealth::UNHEALTHY, $server->health);

        // Create meeting
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
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
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::ROOM_START_FAILED->value);
    }

    /**
     * Tests starting new meeting with a running bbb server
     */
    public function testStartWithServer()
    {
        $room = Room::factory()->create(['record_attendance' => true, 'delete_inactive' => now()->addDay()]);
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
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
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
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING->value);

        // Create meeting without invalid record attendance values
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 'test', 'record' => 0, 'record_video' => 0]))
            ->assertJsonValidationErrors(['record_attendance']);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room]))
            ->assertJsonValidationErrors(['record_attendance']);

        // Create meeting with attendance disabled
        $room->record_attendance = false;
        $room->save();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
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
            ->getJson(route('api.v1.rooms.start', ['room' => $room, 'name' => 'Max Mustermann', 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]));
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
            ->getJson(route('api.v1.rooms.start', ['room' => $room, 'name' => 'Max Mustermann', 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
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
            ->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertForbidden();

        $this->flushHeaders();

        $room->everyone_can_start = true;
        $room->save();

        $response = $this->withHeaders(['Token' => $userToken->token])
            ->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]));
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
            ->getJson(route('api.v1.rooms.start', ['room' => $room,  'record_attendance' => 0, 'record' => 0, 'record_video' => 0]));
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
        $room2 = Room::factory()->create(['room_type_id' => $room->roomType->id]);
        $this->actingAs($room2->owner)->getJson(route('api.v1.rooms.start', ['room' => $room2, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::ROOM_START_FAILED->value);

        // Owner with invalid room type
        $room->roomType->roles()->attach($this->role);
        $room->roomType->update(['restrict' => true]);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::ROOM_TYPE_INVALID->value);

        // User with invalid room type
        $room->everyone_can_start = true;
        $room->save();
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
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
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
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
            $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
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
        $room1 = Room::factory()->create(['record_attendance' => true]);
        $room2 = Room::factory()->create(['record_attendance' => false]);
        $room3 = Room::factory()->create(['record_attendance' => true]);

        $server = Server::factory()->create();
        $room1->roomType->serverPool->servers()->attach($server);
        $room2->roomType->serverPool->servers()->attach($server);
        $room3->roomType->serverPool->servers()->attach($server);

        // Create Fake BBB-Server
        $bbbfaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);

        // Create 3 meetings
        $bbbfaker->addCreateMeetingRequest();
        $bbbfaker->addCreateMeetingRequest();
        $bbbfaker->addCreateMeetingRequest();

        // Create meeting
        $this->actingAs($room1->owner)->getJson(route('api.v1.rooms.start', ['room' => $room1, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();
        $this->actingAs($room2->owner)->getJson(route('api.v1.rooms.start', ['room' => $room2, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();

        // Create meeting with attendance in room type forbidden
        $room3->roomType->allow_record_attendance = false;
        $room3->roomType->save();
        $this->actingAs($room3->owner)->getJson(route('api.v1.rooms.start', ['room' => $room3, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();

        // check correct record attendance after start
        $room1->refresh();
        $room2->refresh();
        $room3->refresh();
        $this->assertTrue($room1->latestMeeting->record_attendance);
        $this->assertFalse($room2->latestMeeting->record_attendance);
        $this->assertFalse($room3->latestMeeting->record_attendance);

        // check if api returns correct record attendance status
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room1]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => true,
            ])
            ->assertJsonPath('last_meeting.end', null);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room2]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => false,
            ])
            ->assertJsonPath('last_meeting.end', null);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room3]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => false,
            ])
            ->assertJsonPath('last_meeting.end', null);

        // check if api return the record attendance status of the currently running meeting, not the room
        $room1->record_attendance = false;
        $room1->save();
        $room2->record_attendance = true;
        $room2->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room1]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => true,
            ])
            ->assertJsonPath('last_meeting.end', null);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room2]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => false,
            ])
            ->assertJsonPath('last_meeting.end', null);

        // check with attendance disabled in room type
        $room1->roomType->allow_record_attendance = false;
        $room1->roomType->save();
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room' => $room1]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'record_attendance' => true,
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

        // Check record status on starting a room with recording disabled
        $room = Room::factory()->create(['record' => false]);
        $room->roomType->serverPool->servers()->attach($server);
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();
        $room->refresh();
        $meeting = $room->latestMeeting;
        $this->assertFalse($meeting->record);

        // Check record status on starting a room with recording enabled
        $room = Room::factory()->create(['record' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 1, 'record_video' => 0]))
            ->assertSuccessful();
        $room->refresh();
        $meeting = $room->latestMeeting;
        $this->assertTrue($meeting->record);

        // Check record status on starting a room with recording enabled, but room type has recording disabled
        $room = Room::factory()->create(['record' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->allow_record = false;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
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
        $room = Room::factory()->create(['record' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 1, 'record_video' => 0]))
            ->assertSuccessful();

        // Don't agree when room is set to record
        $room = Room::factory()->create(['record' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::RECORD_AGREEMENT_MISSING->value);

        // Agree to record when room is set to record but room type has recording disabled
        $room = Room::factory()->create(['record' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->allow_record = false;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 1, 'record_video' => 0]))
            ->assertSuccessful();

        // Don't agree when room is set to record but room type has recording disabled
        $room = Room::factory()->create(['record' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $room->roomType->allow_record = false;
        $room->roomType->save();
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();

        // Agree when room is not set to record
        $room = Room::factory()->create(['record' => false]);
        $room->roomType->serverPool->servers()->attach($server);
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 1, 'record_video' => 0]))
            ->assertSuccessful();

        // Don't agree when room is not set to record
        $room = Room::factory()->create(['record' => false]);
        $room->roomType->serverPool->servers()->attach($server);
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();

        // Check error on invalid record value
        $room = Room::factory()->create(['record' => false]);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 'hello', 'record_video' => 0]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['record']);

        // Check error on missing record value
        $room = Room::factory()->create(['record' => false]);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record_video' => 0]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['record']);
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
        $result = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 1, 'record_video' => 1]));
        $result->assertSuccessful();
        $joinUrl = $result->json('url');
        $this->assertStringContainsString('userdata-bbb_record_video=1', $joinUrl);

        // Don't record own video
        $room = Room::factory()->create(['record' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $bbbFaker->addCreateMeetingRequest();
        $result = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 1, 'record_video' => 0]));
        $result->assertSuccessful();
        $joinUrl = $result->json('url');
        $this->assertStringContainsString('userdata-bbb_record_video=0', $joinUrl);

        // Check error on invalid record video value
        $room = Room::factory()->create(['record' => false]);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 'hello']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['record_video']);

        // Check error on missing record video value
        $room = Room::factory()->create(['record' => false]);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 0]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['record_video']);
    }

    /**
     * Test joining a meeting with a running bbb server
     */
    public function testJoin()
    {
        $room = Room::factory()->create([
            'allow_guests' => true,
            'access_code' => $this->faker->numberBetween(111111111, 999999999),
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
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::ROOM_NOT_RUNNING->value);

        // Testing join with meeting that is starting, but not ready yet
        $meeting = $room->meetings()->create();
        $meeting->server()->associate($server);
        $meeting->save();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
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
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::ROOM_NOT_RUNNING->value);
        $meeting->refresh();
        $this->assertNotNull($meeting->end);

        // Check request was send to the bbb server
        $this->assertEquals('/bigbluebutton/api/getMeetingInfo', $bbbfaker->getRequest(0)->toPsrRequest()->getUri()->getPath());

        // Start meeting
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
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
        $this->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertForbidden();

        // Join as guest without name
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertJsonValidationErrors('name');

        // Join as guest with invalid/dangerous name
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.join', ['room' => $room, 'name' => '<script>alert("HI");</script>', 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertJsonValidationErrors('name')
            ->assertJsonFragment([
                'errors' => [
                    'name' => [
                        'Name contains the following non-permitted characters: <>(");',
                    ],
                ],
            ]);

        // Join as guest
        $response = $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.join', ['room' => $room, 'name' => $this->faker->name, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
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
            ->getJson(route('api.v1.rooms.join', ['room' => $room, 'name' => 'Max Mustermann', 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
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
            ->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals('John Doe', $params['fullName']);
        $this->flushHeaders();

        // Join as authorized users with token
        $response = $this->actingAs($this->user)->withHeaders(['Access-Code' => $room->access_code, 'Token' => $userToken->token])
            ->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals($this->user->fullName, $params['fullName']);
        $this->flushHeaders();
        Auth::logout();

        // Join as authorized users
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertUnauthorized();
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();

        $this->flushHeaders();

        // Testing owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();

        // Testing member
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();

        // Not accepting attendance recording, but meeting is recorded
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING->value);

        // Not accepting attendance recording, but meeting is not recorded
        $room->refresh();
        $runningMeeting = $room->latestMeeting;
        $runningMeeting->record_attendance = false;
        $runningMeeting->save();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();

        // Not accepting attendance recording, but room attendance is disabled
        $runningMeeting->record_attendance = true;
        $runningMeeting->save();
        $room->record_attendance = false;
        $room->save();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING->value);

        // Not accepting attendance recording, but room type rec. attendance is disabled
        $room->record_attendance = true;
        $room->save();
        $room->roomType->allow_record_attendance = false;
        $room->roomType->save();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING->value);

        // Check with invalid values for record_attendance parameter
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 'test', 'record' => 0, 'record_video' => 0]))
            ->assertJsonValidationErrors(['record_attendance']);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room]))
            ->assertJsonValidationErrors(['record_attendance']);
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

        $this->actingAs($meeting->room->owner)->getJson(route('api.v1.rooms.join', ['room' => $meeting->room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
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

        setting()->set('bbb_style', url('style.css'));

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
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();
        $runningMeeting = $room->latestMeeting;

        \Auth::logout();

        // Join as guest
        $guestName = $this->faker->name;
        $response = $this->getJson(route('api.v1.rooms.join', ['room' => $room, 'name' => $guestName, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('VIEWER', $queryParams['role']);
        $this->assertEquals('true', $queryParams['guest']);
        $this->assertEquals($guestName, $queryParams['fullName']);

        // check bbb style url
        $this->assertEquals(url('style.css'), $queryParams['userdata-bbb_custom_style_url']);
        setting()->set('bbb_style', null);

        // Join as authorized users
        $response = $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
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
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('MODERATOR', $queryParams['role']);
        // Check if avatarURL empty, if no profile image is set
        $this->assertFalse(isset($queryParams['avatarURL']));

        // Testing member user
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::USER]]);
        $response = $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('VIEWER', $queryParams['role']);

        // Testing member moderator
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $response = $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('MODERATOR', $queryParams['role']);

        // Testing member co-owner
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $response = $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('MODERATOR', $queryParams['role']);

        // Reset room membership
        $room->members()->sync([]);

        // Testing with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $response = $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('VIEWER', $queryParams['role']);
        $this->role->permissions()->detach($this->viewAllPermission);

        // Testing with manage rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->managePermission);
        $response = $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1, 'record' => 0, 'record_video' => 0]))
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
        $room = Room::factory()->create(['record' => true]);
        $room->roomType->serverPool->servers()->attach($server);
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 1, 'record_video' => 0]))
            ->assertSuccessful();

        // Agree to record when meeting was started with record
        $bbbFaker->addRequest($meetingInfoRequest);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 1, 'record_video' => 0]))
            ->assertSuccessful();

        // Don't agree when meeting was started with record
        $bbbFaker->addRequest($meetingInfoRequest);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::RECORD_AGREEMENT_MISSING->value);

        // Change room setting to disable recording
        // should not have any effect on the current meeting
        $room->record = false;
        $room->save();

        // Check if agreement is still required, as the meeting is still running with recording enabled
        $bbbFaker->addRequest($meetingInfoRequest);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertStatus(CustomStatusCodes::RECORD_AGREEMENT_MISSING->value);

        // Create new meeting with recording disabled
        $room = Room::factory()->create(['record' => false]);
        $room->roomType->serverPool->servers()->attach($server);
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 1, 'record_video' => 0]))
            ->assertSuccessful();

        // Agree when meeting was started without record
        $bbbFaker->addRequest($meetingInfoRequest);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 1, 'record_video' => 0]))
            ->assertSuccessful();

        // Don't agree when meeting was started without record
        $bbbFaker->addRequest($meetingInfoRequest);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();

        // Change room setting to enable recording
        // should not have any effect on the current meeting
        $room->record = true;
        $room->save();

        // Check if agreement is still not required, as the meeting is still running with recording disabled
        $bbbFaker->addRequest($meetingInfoRequest);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
            ->assertSuccessful();

        // Check error on invalid record value
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 'hello', 'record_video' => 0]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['record']);

        // Check error on missing record value
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record_video' => 0]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['record']);
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
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0, 'record' => 1, 'record_video' => 0]))
            ->assertSuccessful();

        // Agree to record own video
        $bbbFaker->addRequest($meetingInfoRequest);
        $result = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 1, 'record_video' => 1]));
        $result->assertSuccessful();
        $joinUrl = $result->json('url');
        $this->assertStringContainsString('userdata-bbb_record_video=1', $joinUrl);

        // Don't record own video
        $bbbFaker->addRequest($meetingInfoRequest);
        $result = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 1, 'record_video' => 0]));
        $result->assertSuccessful();
        $joinUrl = $result->json('url');
        $this->assertStringContainsString('userdata-bbb_record_video=0', $joinUrl);

        // Check error on invalid record video value
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 'hello']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['record_video']);

        // Check error on missing record video value
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 0, 'record' => 0]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['record_video']);
    }
}
