<?php

namespace Tests\Feature\api\v1\Room;

use App\Enums\CustomStatusCodes;
use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Enums\ServerStatus;
use App\Meeting;
use App\Permission;
use App\Role;
use App\Room;
use App\RoomToken;
use App\RoomType;
use App\Server;
use App\Services\RoomTestHelper;
use App\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\ServerSeeder;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\Routing\Route;
use Tests\TestCase;

/**
 * General room api feature tests
 * @package Tests\Feature\api\v1\Room
 */
class RoomTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user, $role, $createPermission, $managePermission, $viewAllPermission;

    /**
     * Setup ressources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'bbb_skip_check_audio' => true
        ]);

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->role                 = Role::factory()->create();
        $this->createPermission     = Permission::where('name', 'rooms.create')->first();
        $this->managePermission     = Permission::where('name', 'rooms.manage')->first();
        $this->viewAllPermission    = Permission::where('name', 'rooms.viewAll')->first();
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

        $room = ['roomType' => $this->faker->randomElement(RoomType::pluck('id')), 'name' => RoomTestHelper::createValidRoomName()];

        // Test unauthenticated user
        $this->postJson(route('api.v1.rooms.store'), $room)
            ->assertUnauthorized();

        // Test unauthorized user
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room)
            ->assertForbidden();

        // Authorize user
        $role       = Role::factory()->create();
        $role->permissions()->attach($this->createPermission);
        $this->user->roles()->attach($role);

        // Try again
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room)
            ->assertCreated();

        // -- Try different invalid requests --

        // empty name and invalid roomtype
        $room = ['roomType' => 0, 'name' => ''];
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room)
            ->assertJsonValidationErrors(['name', 'roomType']);

        // name too short
        $room = ['roomType' => $this->faker->randomElement(RoomType::pluck('id')), 'name' => 'A'];
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room)
            ->assertJsonValidationErrors(['name']);

        // missing parameters
        $room = [];
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room)
            ->assertJsonValidationErrors(['name', 'roomType']);
    }

    /**
     * Check if the room limit is reached and the creation of new rooms is prevented
     */
    public function testCreateNewRoomReachLimit()
    {
        $role       = Role::factory()->create();
        $role->permissions()->attach($this->createPermission);
        $this->user->roles()->attach($role);
        setting(['room_limit' => '1']);

        $room_1 = ['roomType'=>$this->faker->randomElement(RoomType::pluck('id')),'name'=>RoomTestHelper::createValidRoomName()];
        $room_2 = ['roomType'=>$this->faker->randomElement(RoomType::pluck('id')),'name'=>RoomTestHelper::createValidRoomName()];

        // Create first room
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room_1)
            ->assertCreated();

        // Create second room, expect reach of limit
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.store'), $room_2)
            ->assertStatus(CustomStatusCodes::ROOM_LIMIT_EXCEEDED);
    }

    /**
     * Test to delete a room
     */
    public function testDeleteRoom()
    {
        $room = Room::factory()->create();

        // Test unauthenticated user
        $this->deleteJson(route('api.v1.rooms.destroy', ['room'=> $room]))
            ->assertUnauthorized();

        // Test with normal user
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room'=> $room]))
            ->assertForbidden();

        // Test as member user
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::USER]]);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room'=> $room]))
            ->assertForbidden();

        // Test as member moderator
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room'=> $room]))
            ->assertForbidden();

        // Test as member co-owner
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room'=> $room]))
            ->assertForbidden();

        // Remove membership
        $room->members()->sync([]);

        // Test remove with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room'=> $room]))
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Test remove with manage rooms permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room'=> $room]))
            ->assertNoContent();
        $this->role->permissions()->detach($this->managePermission);

        // Recreate room
        $room = Room::factory()->create();

        // Add ownership
        $room->owner()->associate($this->user);
        $room->save();

        // Test with owner
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room'=> $room]))
            ->assertNoContent();

        // Try again after deleted
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.destroy', ['room'=> $room]))
            ->assertNotFound();
    }

    /**
     * Test if guests can access room
     */
    public function testGuestAccess()
    {
        $room = Room::factory()->create([
            'allowGuests' => true
        ]);
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['current_user' => null]);
    }

    /**
     * Test if guests are prevented from accessing room
     */
    public function testDisableGuestAccess()
    {
        $room = Room::factory()->create();
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(403);
    }

    /**
     * Test how guests can log into room with or without valid access code
     */
    public function testAccessCodeGuests()
    {
        $room = Room::factory()->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);
        // Try without access code
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false])
            ->assertJsonFragment(['current_user' => null]);

        // Try with empty access code
        $this->withHeaders(['Access-Code' => ''])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertUnauthorized();

        // Try with random access code
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertUnauthorized();

        // Try with correct access code
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
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
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);

        // Try without access code
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false, 'allowMembership' => false])
            ->assertJsonPath('data.current_user.id', $this->user->id);

        // Try with empty access code
        $this->withHeaders(['Access-Code' => ''])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertUnauthorized();

        // Try with random access code
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertUnauthorized();

        // Try with correct access code
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonPath('data.current_user.id', $this->user->id);

        // Try without access code but membership
        $this->flushHeaders();

        // Try with member user
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::USER]]);
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonPath('data.current_user.id', $this->user->id);

        // Try with member moderator
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::MODERATOR]]);
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonPath('data.current_user.id', $this->user->id);

        // Try with member co-owner
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::CO_OWNER]]);
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonPath('data.current_user.id', $this->user->id);

        $room->members()->sync([]);

        // Try with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true])
            ->assertJsonPath('data.current_user.id', $this->user->id);
        $this->role->permissions()->detach($this->viewAllPermission);

        // Try as owner
        $room->owner()->associate($this->user);
        $room->save();
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::CO_OWNER]]);
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
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

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id'    => $room->id,
                    'name'  => $room->name,
                    'owner' => [
                        'id'   => $room->owner->id,
                        'name' => $room->owner->fullName
                    ],
                    'type' => [
                        'id'            => $room->roomType->id,
                        'short'         => $room->roomType->short,
                        'description'   => $room->roomType->description,
                        'color'         => $room->roomType->color,
                        'allow_listing' => $room->roomType->allow_listing,
                        'model_name'    => 'RoomType',
                        'updated_at'    => $room->roomType->updated_at->toJSON(),
                    ],
                    'model_name'        => 'Room',
                    'authenticated'     => true,
                    'allowMembership'   => $room->allowMembership,
                    'isMember'          => false,
                    'isModerator'       => false,
                    'isCoOwner'         => false,
                    'canStart'          => false,
                    'running'           => false,
                    'record_attendance' => false,
                    'current_user'      => [
                        'id'        => $this->user->id,
                        'firstname' => $this->user->firstname,
                        'lastname'  => $this->user->lastname,
                        'email'     => $this->user->email,
                    ]
                ]
            ]);
    }

    /**
     * Test list of rooms without filter
     */
    public function testRoomList()
    {
        setting(['pagination_page_size' => 10]);
        $user      = User::factory()->create(['firstname'=>'John','lastname'=>'Doe']);
        $roomType1 = RoomType::factory()->create();
        $roomType2 = RoomType::factory()->create(['allow_listing'=>false]);
        $roomType3 = RoomType::factory()->create(['allow_listing'=>true]);

        $room1 = Room::factory()->create(['name'=>'test a','user_id'=>$user->id,'room_type_id'=>$roomType1->id,'listed'=>false,'accessCode'=>123456789]);
        $room2 = Room::factory()->create(['name'=>'test b','user_id'=>$user->id,'room_type_id'=>$roomType1->id,'listed'=>false,'accessCode'=>null]);
        $room3 = Room::factory()->create(['name'=>'room a','user_id'=>$user->id,'room_type_id'=>$roomType2->id,'listed'=>true,'accessCode'=>123456789]);
        $room4 = Room::factory()->create(['name'=>'room b','user_id'=>$user->id,'room_type_id'=>$roomType2->id,'listed'=>true,'accessCode'=>null]);
        $room5 = Room::factory()->create(['name'=>'room b','user_id'=>$user->id,'room_type_id'=>$roomType3->id,'listed'=>true,'accessCode'=>null]);

        // Testing guests access
        $this->getJson(route('api.v1.rooms.index'))
            ->assertUnauthorized();

        // Test as logged in user, without viewAll rooms permission, should only see rooms
        // that are listing and have a room type that allows listing
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index'))
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id'=>$room5->id,'name'=>$room5->name])
            ->assertJsonCount(8, 'meta');

        // Test with viewAll rooms permission
        $role       = Role::factory()->create();
        $role->permissions()->attach($this->viewAllPermission);
        $this->user->roles()->attach($role);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index'))
            ->assertStatus(200)
            ->assertJsonCount(5, 'data')
            ->assertJsonFragment(['id'=>$room1->id,'name'=>$room1->name])
            ->assertJsonFragment(['id'=>$room2->id,'name'=>$room2->name])
            ->assertJsonFragment(['id'=>$room3->id,'name'=>$room3->name])
            ->assertJsonFragment(['id'=>$room4->id,'name'=>$room4->name])
            ->assertJsonCount(8, 'meta');

        // Find by room name
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?search=test')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonCount(8, 'meta');

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?search=test+a')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?search=test+a+xyz')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');

        // Find by owner name
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?search=john')
            ->assertStatus(200)
            ->assertJsonCount(5, 'data');
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?search=john+d')
            ->assertStatus(200)
            ->assertJsonCount(5, 'data');
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?search=john+d+xzy')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');

        // Find by owner name and room name
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?search=test+john')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data');
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?search=test+john+xyz')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');

        // Filter by room types
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?roomTypes[]='.$roomType1->id)
            ->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonCount(8, 'meta');

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?roomTypes[]='.$roomType1->id.'&roomTypes[]='.$roomType2->id)
            ->assertStatus(200)
            ->assertJsonCount(4, 'data');
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?roomTypes[]=0')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');

        // Filter by room types and search
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?roomTypes[]='.$roomType1->id.'&search=test+a')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test list of rooms with filter
     */
    public function testRoomListWithFilter()
    {
        $rooms = Room::factory()->count(4)->create();

        $server   = Server::factory()->create();
        $meeting1 = $rooms[0]->meetings()->create();
        $meeting1->server()->associate($server);
        $meeting1->start       = date('Y-m-d H:i:s');
        $meeting1->attendeePW  = bin2hex(random_bytes(5));
        $meeting1->moderatorPW = bin2hex(random_bytes(5));
        $meeting1->save();

        $meeting2 = $rooms[2]->meetings()->create();
        $meeting2->server()->associate($server);
        $meeting2->start       = date('Y-m-d H:i:s');
        $meeting2->attendeePW  = bin2hex(random_bytes(5));
        $meeting2->moderatorPW = bin2hex(random_bytes(5));
        $meeting2->save();

        // Testing guests access
        $this->getJson(route('api.v1.rooms.index').'?filter=own')
            ->assertUnauthorized();

        // Invalid filter
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter=123')
            ->assertStatus(400);

        // Testing ownership and membership
        $rooms[0]->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $rooms[1]->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $rooms[2]->owner()->associate($this->user);
        $rooms[2]->save();
        $rooms[3]->owner()->associate($this->user);
        $rooms[3]->save();

        // Testing working filter
        $results = $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter=own')
            ->assertOk()
            ->assertJsonFragment(['id'=>$rooms[2]->id])
            ->assertJsonFragment(['id'=>$rooms[3]->id])
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.total_no_filter', 2)
            ->assertJsonCount(9, 'meta')
            ->assertJsonStructure([
                'data' => [
                    0 => [
                        'id',
                        'name',
                        'owner' => [
                            'id',
                            'name',
                        ],
                        'running',
                        'type' => [
                            'id',
                            'short',
                            'description',
                            'color'
                        ],
                        'model_name',
                    ]
                ]
            ]);

        foreach ($results->json('data') as $room) {
            if ($room['id'] == $rooms[2]->id) {
                self::assertTrue($room['running']);
            } else {
                self::assertFalse($room['running']);
            }
        }

        $results = $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter=shared')
            ->assertOk()
            ->assertJsonFragment(['id'=>$rooms[0]->id])
            ->assertJsonFragment(['id'=>$rooms[1]->id])
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.total_no_filter', 2)
            ->assertJsonStructure([
                'data' => [
                    0 => [
                        'id',
                        'name',
                        'owner' => [
                            'id',
                            'name',
                        ],
                        'running',
                        'type' => [
                            'id',
                            'short',
                            'description',
                            'color'
                        ],
                        'model_name',
                    ]
                ]
            ]);

        foreach ($results->json('data') as $room) {
            if ($room['id'] == $rooms[0]->id) {
                self::assertTrue($room['running']);
            } else {
                self::assertFalse($room['running']);
            }
        }
    }

    /**
     * Test search for rooms
     */
    public function testRoomSearch()
    {
        $room = Room::factory()->create(['name'=>'Meeting One']);

        // Testing ownership and membership
        $room->owner()->associate($this->user);
        $room->save();

        // Testing without query
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter=own')
            ->assertOk()
            ->assertJsonFragment(['id'=>$room->id])
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.total_no_filter', 1);

        // Testing with empty query
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter=own&search=')
            ->assertOk()
            ->assertJsonFragment(['id'=>$room->id])
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.total_no_filter', 1);

        // Testing with fragment of the room name
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter=own&search=One')
            ->assertOk()
            ->assertJsonFragment(['id'=>$room->id])
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.total_no_filter', 1);

        // Testing with full name
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter=own&search=Meeting One')
            ->assertOk()
            ->assertJsonFragment(['id'=>$room->id])
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.total_no_filter', 1);

        // Testing with invalid name
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index').'?filter=own&search=Meeting Two')
            ->assertOk()
            ->assertJsonMissing(['id'=>$room->id])
            ->assertJsonPath('meta.total', 0)
            ->assertJsonPath('meta.total_no_filter', 1);
    }

    /**
     * Test callback route for meetings
     */
    public function testEndMeetingCallback()
    {
        $room = Room::factory()->create();

        $server               = new Server();
        $server->base_url     = $this->faker->url;
        $server->salt         = $this->faker->sha1;
        $server->status       = ServerStatus::ONLINE;
        $server->name         = $this->faker->word;
        $server->save();

        $meeting = $room->meetings()->create();
        $meeting->server()->associate($server);
        $meeting->start       = date('Y-m-d H:i:s');
        $meeting->attendeePW  = bin2hex(random_bytes(5));
        $meeting->moderatorPW = bin2hex(random_bytes(5));
        $meeting->save();

        self::assertNull($meeting->end);

        $url = route('api.v1.meetings.endcallback', ['meeting'=>$meeting,'salt'=>$meeting->getCallbackSalt(true)]);

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
        $url = route('api.v1.meetings.endcallback', ['meeting'=>$meeting,'salt'=>$meeting->getCallbackSalt(true)]);
        $this->getJson($url)
            ->assertSuccessful();

        $meeting->refresh();
        self::assertEquals($meeting->end, $end);
    }

    public function testSettingsAccess()
    {
        $room = Room::factory()->create();

        // Testing guests access
        $this->getJson(route('api.v1.rooms.settings', ['room'=>$room]))
            ->assertUnauthorized();

        // Testing access any user
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.settings', ['room'=>$room]))
            ->assertForbidden();

        // Testing member
        $room->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.settings', ['room'=>$room]))
            ->assertForbidden();

        // Testing member as moderator
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.settings', ['room'=>$room]))
            ->assertForbidden();

        // Testing member as co-owner
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.settings', ['room'=>$room]))
            ->assertSuccessful();

        // Reset room membership
        $room->members()->sync([]);

        // Try with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.settings', ['room'=>$room]))
            ->assertSuccessful();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Testing access owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room'=>$room]))
            ->assertSuccessful();
    }

    public function testAccessCodeShown()
    {
        $room = Room::factory()->create([
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);

        // Testing unauthenticated user
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertSuccessful()
            ->assertJsonMissing(['accessCode' => $room->accessCode]);

        // Testing authenticated user
        $this->withHeaders(['Access-Code' => $room->accessCode])->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertSuccessful()
            ->assertJsonMissing(['accessCode' => $room->accessCode]);
        $this->flushHeaders();

        // Testing member
        $room->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertSuccessful()
            ->assertJsonMissing(['accessCode' => $room->accessCode]);

        // Testing member as moderator
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertSuccessful()
            ->assertJsonFragment(['accessCode' => $room->accessCode]);

        // Testing member as co-owner
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertSuccessful()
            ->assertJsonFragment(['accessCode' => $room->accessCode]);

        // Reset room membership
        $room->members()->sync([]);

        // Try with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertSuccessful()
            ->assertJsonFragment(['accessCode' => $room->accessCode]);
        $this->role->permissions()->detach($this->viewAllPermission);

        // Testing access owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertSuccessful()
            ->assertJsonFragment(['accessCode' => $room->accessCode]);
    }

    public function testUpdateSettings()
    {
        $room = Room::factory()->create();
        // Get current settings
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room'=>$room]))
            ->assertSuccessful();

        $settings = $response->json('data');

        $roomType = $this->faker->randomElement(RoomType::all());

        $settings['accessCode']                     = $this->faker->numberBetween(111111111, 999999999);
        $settings['allowMembership']                = $this->faker->boolean;
        $settings['everyoneCanStart']               = true;
        $settings['lockSettingsDisableCam']         = $this->faker->boolean;
        $settings['lockSettingsDisableMic']         = $this->faker->boolean;
        $settings['lockSettingsDisableNote']        = $this->faker->boolean;
        $settings['lockSettingsDisablePrivateChat'] = $this->faker->boolean;
        $settings['lockSettingsDisablePublicChat']  = $this->faker->boolean;
        $settings['lockSettingsLockOnJoin']         = $this->faker->boolean;
        $settings['lockSettingsHideUserList']       = $this->faker->boolean;
        $settings['muteOnStart']                    = $this->faker->boolean;
        $settings['webcamsOnlyForModerator']        = $this->faker->boolean;
        $settings['defaultRole']                    = $this->faker->randomElement([RoomUserRole::MODERATOR,RoomUserRole::USER]);
        $settings['allowGuests']                    = $this->faker->boolean;
        $settings['lobby']                          = $this->faker->randomElement(RoomLobby::getValues());
        $settings['roomType']                       = $roomType->id;
        $settings['duration']                       = $this->faker->numberBetween(1, 50);
        $settings['maxParticipants']                = $this->faker->numberBetween(1, 50);
        $settings['name']                           = RoomTestHelper::createValidRoomName();
        $settings['welcome']                        = $this->faker->text;
        $settings['listed']                         = $this->faker->boolean;
        $settings['record_attendance']              = $this->faker->boolean;

        // Testing user
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.update', ['room'=>$room]), $settings)
            ->assertForbidden();

        // Testing member as user
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::USER]]);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.update', ['room'=>$room]), $settings)
            ->assertForbidden();

        // Testing member as moderator
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.update', ['room'=>$room]), $settings)
            ->assertForbidden();

        // Testing member as co-owner
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.update', ['room'=>$room]), $settings)
            ->assertSuccessful();

        // Reset room membership
        $room->members()->sync([]);

        // Try with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.update', ['room'=>$room]), $settings)
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Try with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->putJson(route('api.v1.rooms.update', ['room'=>$room]), $settings)
            ->assertSuccessful();
        $this->role->permissions()->detach($this->managePermission);

        // Test as owner
        $this->actingAs($room->owner)->putJson(route('api.v1.rooms.update', ['room'=>$room]), $settings)
            ->assertSuccessful();

        // Get new settings
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room'=>$room]))
            ->assertSuccessful();

        $new_settings         = $response->json('data');
        $settings['roomType'] = new \App\Http\Resources\RoomType($roomType);

        $this->assertJsonStringEqualsJsonString(json_encode($new_settings), json_encode($settings));
    }

    public function testUpdateSettingsInvalid()
    {
        $room = Room::factory()->create();
        // Get current settings
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room'=>$room]))
            ->assertSuccessful();

        $settings = $response->json('data');

        // Room type invalid format
        $settings['roomType']            = [ 'id' => 5 ];
        $this->putJson(route('api.v1.rooms.update', ['room'=>$room]), $settings)
            ->assertJsonValidationErrors(['roomType']);

        // Name too short
        $settings['name']            = 'A';
        $settings['roomType']        = $this->faker->randomElement(RoomType::pluck('id'));
        $this->putJson(route('api.v1.rooms.update', ['room'=>$room]), $settings)
            ->assertJsonValidationErrors(['name']);

        $settings['accessCode']      = $this->faker->numberBetween(1111111, 9999999);
        $settings['defaultRole']     = RoomUserRole::GUEST;
        $settings['duration']        = -10;
        $settings['lobby']           = 5;
        $settings['maxParticipants'] = -10;
        $settings['name']            = null;
        $settings['roomType']        = 0;

        $this->putJson(route('api.v1.rooms.update', ['room'=>$room]), $settings)
            ->assertJsonValidationErrors(['accessCode','defaultRole','duration','lobby','maxParticipants','name','roomType']);
    }

    /**
     * Testing to start room but no server available
     */
    public function testStartRestrictedNoServer()
    {
        $room = Room::factory()->create([
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);

        // Testing guests
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertForbidden();
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room,'code'=>$room->accessCode,'record_attendance' => 1]))
            ->assertForbidden();

        // Testing authorized users
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertForbidden();
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room,'code'=>$room->accessCode,'record_attendance' => 1]))
            ->assertForbidden();

        // Testing member
        $room->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertForbidden();

        // Testing member as moderator
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);

        // Testing member as co-owner
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);

        // Reset room membership
        $room->members()->sync([]);

        // Try with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Try with manage all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);
        $this->role->permissions()->detach($this->managePermission);

        // Testing owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);
    }

    /**
     * Testing to start room with guests allowed, and everyone can start but no server available
     */
    public function testStartNoServer()
    {
        $room = Room::factory()->create([
            'allowGuests'      => true,
            'everyoneCanStart' => true,
            'accessCode'       => $this->faker->numberBetween(111111111, 999999999)
        ]);

        // Testing guests
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertUnauthorized();
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertJsonValidationErrors('name');
        // Join as guest with invalid/dangerous name
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.start', ['room'=>$room,'name'=>'<script>alert("HI");</script>','record_attendance' => 1]))
            ->assertJsonValidationErrors('name')
            ->assertJsonFragment([
                'errors' => [
                    'name' => [
                        'Name contains the following non-permitted characters: <>(");'
                    ]
                ]
            ]);
        // Join as guest with invalid/dangerous name that contains non utf8 chars
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.start', ['room'=>$room,'name'=>'§´`','record_attendance' => 1]))
            ->assertJsonValidationErrors('name')
            ->assertJsonFragment([
                'errors' => [
                    'name' => [
                       'Name contains non-permitted characters'
                    ]
                ]
            ]);

        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.start', ['room'=>$room,'name'=>$this->faker->name,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);

        $this->flushHeaders();

        // Testing authorized users
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertUnauthorized();
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);

        $this->flushHeaders();

        // Testing owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);

        // Testing member
        $room->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);
    }

    public function testStartAndJoinWithWrongServerDetails()
    {
        $room = Room::factory()->create();

        // Adding fake server(s)
        $server =  Server::factory()->create();
        $room->roomType->serverPool->servers()->sync([$server->id]);

        // Create meeting
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::ROOM_START_FAILED);

        $server->refresh();
        $this->assertEquals(ServerStatus::OFFLINE, $server->status);

        // Create meeting
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::MEETING_NOT_RUNNING);
    }

    /**
     * Tests starting new meeting with a running bbb server
     */
    public function testStartWithServer()
    {
        // Allow attendance recording
        setting(['attendance.enabled' => true]);

        $room = Room::factory()->create(['record_attendance' => true, 'delete_inactive'=> now()->addDay()]);
        $room->owner->update(['bbb_skip_check_audio' => true]);

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Create meeting
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertSuccessful();
        $this->assertIsString($response->json('url'));
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('true', $queryParams['userdata-bbb_skip_check_audio']);

        // Try to start bbb meeting
        $response = Http::withOptions(['allow_redirects' => false])->get($response->json('url'));
        $this->assertEquals(302, $response->status());
        $this->assertArrayHasKey('Location', $response->headers());

        // Check if delete flag is removed on start
        $room->refresh();
        $this->assertNull($room->delete_inactive);

        // Clear
        $room->runningMeeting()->endMeeting();

        // Create meeting without agreement to record attendance
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 0]))
            ->assertStatus(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING);

        // Create meeting without invalid record attendance values
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 'test']))
            ->assertJsonValidationErrors(['record_attendance']);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertJsonValidationErrors(['record_attendance']);

        // Create meeting with attendance globally disabled
        setting(['attendance.enabled' => false]);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 0]))
            ->assertSuccessful();
        $room->runningMeeting()->endMeeting();

        // Create meeting with attendance disabled
        setting(['attendance.enabled' => true]);
        $room->record_attendance = false;
        $room->save();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 0]))
            ->assertSuccessful();
        $room->runningMeeting()->endMeeting();

        // Room token moderator
        Auth::logout();

        $moderatorToken = RoomToken::factory()->create([
            'room_id'   => $room->id,
            'role'      => RoomUserRole::MODERATOR,
            'firstname' => 'John',
            'lastname'  => 'Doe'
        ]);

        $response = $this->withHeaders(['Token' => $moderatorToken->token])
            ->getJson(route('api.v1.rooms.start', ['room' => $room, 'name' => 'Max Mustermann', 'record_attendance' => 0]));
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals('John Doe', $params['fullName']);
        $room->runningMeeting()->endMeeting();

        $this->flushHeaders();

        $room->allowGuests      = true;
        $room->everyoneCanStart = false;
        $room->save();

        $this->withHeaders(['Token' => 'Test'])
            ->getJson(route('api.v1.rooms.start', ['room' => $room, 'name' => 'Max Mustermann', 'record_attendance' => 0]))
            ->assertUnauthorized();

        $this->flushHeaders();

        // Room token user
        $userToken = RoomToken::factory()->create([
            'room_id'   => $room->id,
            'role'      => RoomUserRole::USER,
            'firstname' => 'John',
            'lastname'  => 'Doe'
        ]);

        $this->withHeaders(['Token' => $userToken->token])
            ->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0]))
            ->assertForbidden();

        $this->flushHeaders();

        $room->everyoneCanStart = true;
        $room->save();

        $response = $this->withHeaders(['Token' => $userToken->token])
            ->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0]));
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals('John Doe', $params['fullName']);
        $room->runningMeeting()->endMeeting();

        $this->flushHeaders();

        // Token with authenticated user
        $response = $this->withHeaders(['Token' => $userToken->token])
            ->actingAs($this->user)
            ->getJson(route('api.v1.rooms.start', ['room' => $room,  'record_attendance' => 0]));
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals($this->user->fullName, $params['fullName']);
        $room->runningMeeting()->endMeeting();

        $this->flushHeaders();

        // Check with wrong salt/secret
        foreach (Server::all() as $server) {
            $server->salt = 'TEST';
            $server->save();
        }
        $room2 = Room::factory()->create(['room_type_id'=>$room->roomType->id]);
        $this->actingAs($room2->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room2,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::ROOM_START_FAILED);

        // Owner with invalid room type
        $room->roomType->roles()->attach($this->role);
        $room->roomType->update(['restrict' => true]);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::ROOM_TYPE_INVALID);

        // User with invalid room type
        $room->everyoneCanStart = true;
        $room->save();
        $room->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::ROOM_TYPE_INVALID);
    }

    /**
     * Tests starting new meeting with a running bbb server
     */
    public function testStartWithServerMeetingRunning()
    {
        // Add room, real servers and a fake meeting
        $room = Room::factory()->create();
        $this->seed(ServerSeeder::class);
        $meeting = Meeting::factory()->create(['room_id'=> $room->id, 'start' => null, 'end' => null, 'server_id' => Server::all()->first()]);

        // Start room that is currently starting but not ready yet
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0]))
            ->assertStatus(460);
        $meeting->refresh();
        $this->assertNull($meeting->end);

        // Start room that should run on the server but isn't
        $meeting->start = now();
        $meeting->save();
        // Start room that is currently starting but not ready yet
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0]))
            ->assertStatus(460);
        $meeting->refresh();
        $this->assertNotNull($meeting->end);

        // Start room without recording acceptance, but a room with attendance recording is already running
        setting(['attendance.enabled' => true]);
        $room->record_attendance = true;
        $room->save();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 1]))
            ->assertSuccessful();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0]))
            ->assertStatus(470);
    }

    /**
     * Tests parallel starting of the same room
     */
    public function testStartWhileStarting()
    {
        config(['bigbluebutton.server_timeout' => 2]);
        $room = Room::factory()->create();
        $lock = Cache::lock('startroom-'.$room->id, config('bigbluebutton.server_timeout'));

        try {
            // Simulate that another request is currently starting this room
            $lock->block(config('bigbluebutton.server_timeout'));

            // Try to start the room
            $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0]))
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
        $room1 = Room::factory()->create(['record_attendance'=>true]);
        $room2 = Room::factory()->create(['record_attendance'=>false]);
        $room3 = Room::factory()->create(['record_attendance'=>true]);

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Create meeting with attendance allowed globally
        setting(['attendance.enabled' => true]);
        $this->actingAs($room1->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room1,'record_attendance' => 1]))
            ->assertSuccessful();
        $this->actingAs($room2->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room2,'record_attendance' => 1]))
            ->assertSuccessful();
        // Create meeting with attendance  globally forbidden
        setting(['attendance.enabled' => false]);
        $this->actingAs($room3->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room3,'record_attendance' => 1]))
            ->assertSuccessful();

        // check correct record attendance after start
        $this->assertTrue($room1->runningMeeting()->record_attendance);
        $this->assertFalse($room2->runningMeeting()->record_attendance);
        $this->assertFalse($room3->runningMeeting()->record_attendance);

        setting(['attendance.enabled' => true]);

        // check if api returns correct record attendance status
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room1]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'running'           => true,
                'record_attendance' => true
            ]);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room2]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'running'           => true,
                'record_attendance' => false
            ]);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room3]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'running'           => true,
                'record_attendance' => false
            ]);

        // check with attendance globally disabled, after starting meeting
        setting(['attendance.enabled' => false]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room1]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'running'           => true,
                'record_attendance' => false
            ]);

        setting(['attendance.enabled' => true]);

        // check if api return the record attendance status of the currently running meeting, not the room
        $room1->record_attendance = false;
        $room1->save();
        $room2->record_attendance = true;
        $room2->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room1]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'running'           => true,
                'record_attendance' => true
            ]);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room2]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'running'           => true,
                'record_attendance' => false
            ]);

        // check with attendance globally disabled
        setting(['attendance.enabled' => false]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room1]))
            ->assertStatus(200)
            ->assertJsonFragment([
                'running'           => true,
                'record_attendance' => false
            ]);

        // Clear
        $room1->runningMeeting()->endMeeting();
        $room2->runningMeeting()->endMeeting();
    }

    /**
     * Test joining a meeting with a running bbb server
     */
    public function testJoin()
    {
        // Allow attendance recording
        setting(['attendance.enabled' => true]);

        $room = Room::factory()->create([
            'allowGuests'       => true,
            'accessCode'        => $this->faker->numberBetween(111111111, 999999999),
            'record_attendance' => true,
        ]);
        $room->owner->update(['bbb_skip_check_audio' => true]);

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Testing join with meeting not running
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::MEETING_NOT_RUNNING);

        // Testing join with meeting that is starting, but not ready yet
        $meeting              = $room->meetings()->create();
        $meeting->attendeePW  = bin2hex(random_bytes(5));
        $meeting->moderatorPW = bin2hex(random_bytes(5));
        $meeting->server()->associate(Server::where('status', ServerStatus::ONLINE)->get()->random());
        $meeting->save();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::MEETING_NOT_RUNNING);
        $meeting->delete();

        // Test to join a meeting marked in the db as running, but isn't running on the server
        $meeting              = $room->meetings()->create();
        $meeting->start       = date('Y-m-d H:i:s');
        $meeting->attendeePW  = bin2hex(random_bytes(5));
        $meeting->moderatorPW = bin2hex(random_bytes(5));
        $meeting->server()->associate(Server::where('status', ServerStatus::ONLINE)->get()->random());
        $meeting->save();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::MEETING_NOT_RUNNING);
        $meeting->refresh();
        $this->assertNotNull($meeting->end);

        // Start meeting
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertSuccessful();
        $this->assertIsString($response->json('url'));
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('true', $queryParams['userdata-bbb_skip_check_audio']);

        // Try to start bbb meeting
        $response = Http::withOptions(['allow_redirects' => false])->get($response->json('url'));
        $this->assertEquals(302, $response->status());
        $this->assertArrayHasKey('Location', $response->headers());

        \Auth::logout();

        // Check if room is running
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertSuccessful()
            ->assertJsonFragment(['running' => true]);

        // Join as guest, without required access code
        $this->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertForbidden();

        // Join as guest without name
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertJsonValidationErrors('name');

        // Join as guest with invalid/dangerous name
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.join', ['room'=>$room,'name'=>'<script>alert("HI");</script>','record_attendance' => 1]))
            ->assertJsonValidationErrors('name')
            ->assertJsonFragment([
                'errors' => [
                    'name' => [
                        'Name contains the following non-permitted characters: <>(");'
                    ]
                ]
            ]);

        // Join as guest
        $response = $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.join', ['room'=>$room,'name'=>$this->faker->name,'record_attendance' => 1]))
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals('false', $queryParams['userdata-bbb_skip_check_audio']);

        $this->flushHeaders();

        // Join token moderator
        Auth::logout();

        $moderatorToken = RoomToken::factory()->create([
            'room_id'   => $room->id,
            'role'      => RoomUserRole::MODERATOR,
            'firstname' => 'John',
            'lastname'  => 'Doe'
        ]);

        $response = $this->withHeaders(['Token' => $moderatorToken->token])
            ->getJson(route('api.v1.rooms.join', ['room' => $room, 'name' => 'Max Mustermann', 'record_attendance' => 1]))
            ->assertSuccessful();
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals('John Doe', $params['fullName']);
        $this->flushHeaders();

        // Join token user
        $userToken = RoomToken::factory()->create([
            'room_id'   => $room->id,
            'role'      => RoomUserRole::USER,
            'firstname' => 'John',
            'lastname'  => 'Doe'
        ]);

        $response = $this->withHeaders(['Token' => $userToken->token])
            ->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1]))
            ->assertSuccessful();
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals('John Doe', $params['fullName']);
        $this->flushHeaders();

        // Join as authorized users with token
        $response = $this->actingAs($this->user)->withHeaders(['Access-Code' => $room->accessCode, 'Token' => $userToken->token])
            ->getJson(route('api.v1.rooms.join', ['room' => $room, 'record_attendance' => 1]))
            ->assertSuccessful();
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals($this->user->fullName, $params['fullName']);
        $this->flushHeaders();
        Auth::logout();

        // Join as authorized users
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertUnauthorized();
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertSuccessful();

        $this->flushHeaders();

        // Testing owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertSuccessful();

        // Testing member
        $room->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertSuccessful();

        $runningMeeting = $room->runningMeeting();

        // Not accepting attendance recording, but meeting is recorded
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 0]))
            ->assertStatus(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING);

        // Not accepting attendance recording, but meeting is not recorded
        $runningMeeting->record_attendance = false;
        $runningMeeting->save();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 0]))
            ->assertSuccessful();

        // Not accepting attendance recording, but globally attendance recording is disabled
        $runningMeeting->record_attendance = true;
        $runningMeeting->save();
        setting(['attendance.enabled' => false]);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 0]))
            ->assertSuccessful();

        // Check with invalid values for record_attendance parameter
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 'test']))
            ->assertJsonValidationErrors(['record_attendance']);
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room]))
            ->assertJsonValidationErrors(['record_attendance']);

        // Clear
        $this->assertNull($runningMeeting->end);
        $runningMeeting->endMeeting();
        $runningMeeting->refresh();
        $this->assertNotNull($runningMeeting->end);
    }

    /**
     * Test joining urls contains correct role and name
     */
    public function testJoinUrl()
    {
        $room = Room::factory()->create([
            'allowGuests' => true
        ]);

        setting()->set('bbb_style', url('style.css'));

        // Set user profile image
        $this->user->image = 'test.jpg';
        $this->user->save();

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Start meeting
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertSuccessful();
        $runningMeeting = $room->runningMeeting();
        $attendeePW     = $runningMeeting->attendeePW;
        $moderatorPW    = $runningMeeting->moderatorPW;

        \Auth::logout();

        // Join as guest
        $guestName = $this->faker->name;
        $response  = $this->getJson(route('api.v1.rooms.join', ['room'=>$room,'name'=>$guestName,'record_attendance' => 1]))
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals($attendeePW, $queryParams['password']);
        $this->assertEquals('true', $queryParams['guest']);
        $this->assertEquals($guestName, $queryParams['fullName']);

        // check bbb style url
        $this->assertEquals(url('style.css'), $queryParams['userdata-bbb_custom_style_url']);
        setting()->set('bbb_style', null);

        // Join as authorized users
        $response = $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals($attendeePW, $queryParams['password']);
        $this->assertEquals($this->user->fullname, $queryParams['fullName']);
        // Check if avatarURL is set, if profile image exists
        $this->assertEquals($this->user->imageUrl, $queryParams['avatarURL']);
        // check bbb style url missing if not set
        $this->assertArrayNotHasKey('userdata-bbb_custom_style_url', $queryParams);

        // Testing owner
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals($moderatorPW, $queryParams['password']);
        // Check if avatarURL empty, if no profile image is set
        $this->assertFalse(isset($queryParams['avatarURL']));

        // Testing member user
        $room->members()->sync([$this->user->id => ['role'=>RoomUserRole::USER]]);
        $response = $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals($attendeePW, $queryParams['password']);

        // Testing member moderator
        $room->members()->sync([$this->user->id => ['role'=>RoomUserRole::MODERATOR]]);
        $response = $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals($moderatorPW, $queryParams['password']);

        // Testing member co-owner
        $room->members()->sync([$this->user->id => ['role'=>RoomUserRole::CO_OWNER]]);
        $response = $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals($moderatorPW, $queryParams['password']);

        // Reset room membership
        $room->members()->sync([]);

        // Testing with view all rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $response = $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals($attendeePW, $queryParams['password']);
        $this->role->permissions()->detach($this->viewAllPermission);

        // Testing with manage rooms permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->managePermission);
        $response = $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertSuccessful();
        $queryParams = [];
        parse_str(parse_url($response->json('url'))['query'], $queryParams);
        $this->assertEquals($moderatorPW, $queryParams['password']);
        $this->role->permissions()->detach($this->managePermission);

        // Clear
        $this->assertNull($runningMeeting->end);
        $runningMeeting->endMeeting();
        $runningMeeting->refresh();
        $this->assertNotNull($runningMeeting->end);
    }

    /**
     * Test lobby behavior if enabled for everyone
     */
    public function testLobbyEnabled()
    {
        $room = Room::factory()->create([
            'allowGuests' => true,
            'lobby'       => RoomLobby::ENABLED,
        ]);

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Start meeting
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertSuccessful();

        // Check guests
        $this->assertTrue($this->checkGuestWaitPage($room));

        // Check auth. users
        $this->assertTrue($this->checkGuestWaitPage($room, $this->user));

        // Check owner
        $this->assertFalse($this->checkGuestWaitPage($room, $room->owner));

        // Testing member
        $room->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $this->assertTrue($this->checkGuestWaitPage($room, $this->user));

        // Testing moderator member
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::MODERATOR]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Testing co-owner member
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::CO_OWNER]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Clear
        $room->runningMeeting()->endMeeting();
    }

    /**
     * Test lobby behavior if enabled only for guests
     */
    public function testLobbyOnlyGuests()
    {
        $room = Room::factory()->create([
            'allowGuests' => true,
            'lobby'       => RoomLobby::ONLY_GUEST,
        ]);
        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Start meeting
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 1]))
            ->assertSuccessful();

        // Check guests
        $this->assertTrue($this->checkGuestWaitPage($room));

        // Check auth. users
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Check owner
        $this->assertFalse($this->checkGuestWaitPage($room, $room->owner));

        // Testing member
        $room->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Testing moderator member
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::MODERATOR]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Testing co-owner member
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::CO_OWNER]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Clear
        $room->runningMeeting()->endMeeting();
    }

    /**
     * Check if user or guest enters room or lobby
     * @param $room Room room
     * @param  null $user user or guest
     * @return bool is entering lobby
     */
    protected function checkGuestWaitPage($room, $user = null)
    {
        // logout from previous calls
        \Auth::logout();
        // login as user is not guest
        $request = $user == null ? $this : $this->actingAs($user);
        // join meeting
        $response = $request->getJson(route('api.v1.rooms.join', ['room'=>$room,'code'=>$room->accessCode,'name'=>$this->faker->name,'record_attendance' => 1]))
            ->assertSuccessful();
        // check if response has a join url
        $this->assertIsString($response->json('url'));
        // check if join url is working
        $response        = Http::withOptions(['allow_redirects' =>['track_redirects' => true]])->get($response->json('url'));
        $headersRedirect = $response->getHeader(\GuzzleHttp\RedirectMiddleware::HISTORY_HEADER);
        $this->assertNotEmpty($headersRedirect);

        return Str::contains(last($headersRedirect), 'guestWait');
    }
}
