<?php

namespace Tests\Integration\api\v1;

use App\Enums\CustomStatusCodes;
use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Enums\ServerStatus;
use App\Models\Meeting;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomToken;
use App\Models\Server;
use App\Models\User;
use App\Services\BigBlueButton\LaravelHTTPClient;
use App\Services\MeetingService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\ServerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
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
        $response = LaravelHTTPClient::httpClient()->withOptions(['allow_redirects' => false])->get($response->json('url'));
        $this->assertEquals(302, $response->status());
        $this->assertArrayHasKey('Location', $response->headers());

        // Check if delete flag is removed on start
        $room->refresh();
        $this->assertNull($room->delete_inactive);

        // Clear
        (new MeetingService($room->runningMeeting()))->end();

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
        (new MeetingService($room->runningMeeting()))->end();

        // Create meeting with attendance disabled
        setting(['attendance.enabled' => true]);
        $room->record_attendance = false;
        $room->save();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room,'record_attendance' => 0]))
            ->assertSuccessful();
        (new MeetingService($room->runningMeeting()))->end();

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
        (new MeetingService($room->runningMeeting()))->end();

        $this->flushHeaders();

        $room->allow_guests       = true;
        $room->everyone_can_start = false;
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

        $room->everyone_can_start = true;
        $room->save();

        $response = $this->withHeaders(['Token' => $userToken->token])
            ->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 0]));
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals('John Doe', $params['fullName']);
        (new MeetingService($room->runningMeeting()))->end();

        $this->flushHeaders();

        // Token with authenticated user
        $response = $this->withHeaders(['Token' => $userToken->token])
            ->actingAs($this->user)
            ->getJson(route('api.v1.rooms.start', ['room' => $room,  'record_attendance' => 0]));
        $url_components = parse_url($response['url']);
        parse_str($url_components['query'], $params);
        $this->assertEquals($this->user->fullName, $params['fullName']);
        (new MeetingService($room->runningMeeting()))->end();

        $this->flushHeaders();

        // Check with wrong secret
        foreach (Server::all() as $server) {
            $server->secret = 'TEST';
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
        $room->everyone_can_start = true;
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
        (new MeetingService($room1->runningMeeting()))->end();
        (new MeetingService($room2->runningMeeting()))->end();
    }

    /**
     * Test joining a meeting with a running bbb server
     */
    public function testJoin()
    {
        // Allow attendance recording
        setting(['attendance.enabled' => true]);

        $room = Room::factory()->create([
            'allow_guests'       => true,
            'access_code'        => $this->faker->numberBetween(111111111, 999999999),
            'record_attendance'  => true,
        ]);
        $room->owner->update(['bbb_skip_check_audio' => true]);

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Testing join with meeting not running
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::MEETING_NOT_RUNNING);

        // Testing join with meeting that is starting, but not ready yet
        $meeting               = $room->meetings()->create();
        $meeting->attendee_pw  = bin2hex(random_bytes(5));
        $meeting->moderator_pw = bin2hex(random_bytes(5));
        $meeting->server()->associate(Server::where('status', ServerStatus::ONLINE)->get()->random());
        $meeting->save();
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertStatus(CustomStatusCodes::MEETING_NOT_RUNNING);
        $meeting->delete();

        // Test to join a meeting marked in the db as running, but isn't running on the server
        $meeting               = $room->meetings()->create();
        $meeting->start        = date('Y-m-d H:i:s');
        $meeting->attendee_pw  = bin2hex(random_bytes(5));
        $meeting->moderator_pw = bin2hex(random_bytes(5));
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
        $response = LaravelHTTPClient::httpClient()->withOptions(['allow_redirects' => false])->get($response->json('url'));
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
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
            ->assertJsonValidationErrors('name');

        // Join as guest with invalid/dangerous name
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.join', ['room'=>$room,'name'=>'<script>alert("HI");</script>','record_attendance' => 1]))
            ->assertJsonValidationErrors('name')
            ->assertJsonFragment([
                'errors' => [
                    'name' => [
                        'Name contains the following non-permitted characters: <>(");'
                    ]
                ]
            ]);

        // Join as guest
        $response = $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.join', ['room'=>$room,'name'=>$this->faker->name,'record_attendance' => 1]))
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
        $response = $this->actingAs($this->user)->withHeaders(['Access-Code' => $room->access_code, 'Token' => $userToken->token])
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
        $this->withHeaders(['Access-Code' => $room->access_code])->getJson(route('api.v1.rooms.join', ['room'=>$room,'record_attendance' => 1]))
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
        (new MeetingService($runningMeeting))->end();
        $runningMeeting->refresh();
        $this->assertNotNull($runningMeeting->end);
    }

    /**
     * Test joining urls contains correct role and name
     */
    public function testJoinUrl()
    {
        $room = Room::factory()->create([
            'allow_guests' => true
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
        $attendeePW     = $runningMeeting->attendee_pw;
        $moderatorPW    = $runningMeeting->moderator_pw;

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
        (new MeetingService($runningMeeting))->end();
        $runningMeeting->refresh();
        $this->assertNotNull($runningMeeting->end);
    }

    /**
     * Test lobby behavior if enabled for everyone
     */
    public function testLobbyEnabled()
    {
        $room = Room::factory()->create([
            'allow_guests' => true,
            'lobby'        => RoomLobby::ENABLED,
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
        $room->members()->sync([$this->user->id => ['role'=>RoomUserRole::MODERATOR]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Testing co-owner member
        $room->members()->sync([$this->user->id => ['role'=>RoomUserRole::CO_OWNER]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Clear
        (new MeetingService($room->runningMeeting()))->end();
    }

    /**
     * Test lobby behavior if enabled only for guests
     */
    public function testLobbyOnlyGuests()
    {
        $room = Room::factory()->create([
            'allow_guests' => true,
            'lobby'        => RoomLobby::ONLY_GUEST,
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
        $room->members()->sync([$this->user->id => ['role'=>RoomUserRole::MODERATOR]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Testing co-owner member
        $room->members()->sync([$this->user->id => ['role'=>RoomUserRole::CO_OWNER]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Clear
        (new MeetingService($room->runningMeeting()))->end();
    }

    /**
     * Check if user or guest enters room or lobby
     * @param Room $room Room
     * @param  User|null User or guest
     * @return bool is entering lobby
     */
    protected function checkGuestWaitPage(Room $room, ?User $user = null)
    {
        // logout from previous calls
        \Auth::logout();
        // login as user is not guest
        $request = $user == null ? $this : $this->actingAs($user);
        // join meeting
        $response = $request->getJson(route('api.v1.rooms.join', ['room'=>$room,'code'=>$room->access_code,'name'=>$this->faker->name,'record_attendance' => 1]))
            ->assertSuccessful();
        // check if response has a join url
        $this->assertIsString($response->json('url'));
        // check if join url is working
        $response        = LaravelHTTPClient::httpClient()->withOptions(['allow_redirects' =>['track_redirects' => true]])->get($response->json('url'));
        $headersRedirect = $response->getHeader(\GuzzleHttp\RedirectMiddleware::HISTORY_HEADER);
        $this->assertNotEmpty($headersRedirect);

        return Str::contains(last($headersRedirect), 'guestWait');
    }
}
