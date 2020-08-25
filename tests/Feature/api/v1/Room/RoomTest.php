<?php

namespace Tests\Feature\api\v1\Room;

use App\Enums\CustomStatusCodes;
use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Room;
use App\RoomType;
use App\Server;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * General room api feature tests
 * @package Tests\Feature\api\v1\Room
 */
class RoomTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    /**
     * Setup ressources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->user = factory(User::class)->create();
    }

    /**
     * Test if guests can access room
     */
    public function testGuestAccess()
    {
        $room = factory(Room::class)->create([
            'allowGuests' => true
        ]);
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200);
    }

    /**
     * Test if guests are prevented from accessing room
     */
    public function testDisableGuestAccess()
    {
        $room = factory(Room::class)->create();
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(403);
    }

    /**
     * Test how guests can log into room with or without valid access code
     */
    public function testAccessCodeGuests()
    {
        $room = factory(Room::class)->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);
        // Try without access code
        $this->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false]);

        // Try with empty access code
        $this->withHeaders(['Access-Code' => ''])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertUnauthorized();

        // Try with random access code
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertUnauthorized();

        // Try with correct access code
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true]);
    }

    /**
     * Test how users can log into room with or without valid access code
     */
    public function testAccessCodeUser()
    {
        $room = factory(Room::class)->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);

        // Try without access code
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => false, 'allowMembership' => false]);

        // Try with empty access code
        $this->withHeaders(['Access-Code' => ''])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertUnauthorized();

        // Try with random access code
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertUnauthorized();

        // Try with correct access code
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.show', ['room'=>$room]))
            ->assertStatus(200)
            ->assertJsonFragment(['authenticated' => true]);
    }

    /**
     * Test list of rooms
     */
    public function testRoomList()
    {
        $rooms = factory(Room::class, 4)->create();

        // Testing guests access
        $this->getJson(route('api.v1.rooms.index'))
            ->assertUnauthorized();

        // Testing authorized users access, structure and empty list
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index'))
            ->assertOk()
            ->assertJsonStructure(['data' => [
                'myRooms',
                'sharedRooms'
            ]])
            ->assertJsonMissing(['id'=>$rooms[0]->id]);

        // Testing ownership and membership
        $rooms[0]->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $rooms[1]->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $rooms[2]->owner()->associate($this->user);
        $rooms[2]->save();
        $rooms[3]->owner()->associate($this->user);
        $rooms[3]->save();

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.index'))
            ->assertOk()
            ->assertJsonFragment(['id'=>$rooms[0]->id])
            ->assertJsonFragment(['id'=>$rooms[1]->id])
            ->assertJsonFragment(['id'=>$rooms[2]->id])
            ->assertJsonFragment(['id'=>$rooms[3]->id]);
    }

    public function testSettingsAccess()
    {
        $room = factory(Room::class)->create();

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

        // Testing access owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room'=>$room]))
            ->assertSuccessful();
    }

    public function testUpdateSettings()
    {
        $room = factory(Room::class)->create();
        // Get current settings
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room'=>$room]))
            ->assertSuccessful();

        $settings = $response->json('data');

        $settings['accessCode']                     = $this->faker->numberBetween(111111111, 999999999);
        $settings['allowGuests']                    = $this->faker->boolean;
        $settings['allowMembership']                = $this->faker->boolean;
        $settings['defaultRole']                    = $this->faker->randomElement([RoomUserRole::MODERATOR,RoomUserRole::USER]);
        $settings['duration']                       = $this->faker->numberBetween(1, 50);
        $settings['everyoneCanStart']               = true;
        $settings['lobby']                          = $this->faker->randomElement(RoomLobby::getValues());
        $settings['lockSettingsDisableCam']         = $this->faker->boolean;
        $settings['lockSettingsDisableMic']         = $this->faker->boolean;
        $settings['lockSettingsDisableNote']        = $this->faker->boolean;
        $settings['lockSettingsDisablePrivateChat'] = $this->faker->boolean;
        $settings['lockSettingsDisablePublicChat']  = $this->faker->boolean;
        $settings['lockSettingsHideUserList']       = $this->faker->boolean;
        $settings['lockSettingsLockOnJoin']         = $this->faker->boolean;
        $settings['maxParticipants']                = $this->faker->numberBetween(1, 50);
        $settings['muteOnStart']                    = $this->faker->boolean;
        $settings['name']                           = $this->faker->word;
        $settings['roomType']                       = $this->faker->randomElement(RoomType::pluck('id'));
        $settings['webcamsOnlyForModerator']        = $this->faker->boolean;

        $this->putJson(route('api.v1.rooms.update', ['room'=>$room]), $settings)
            ->assertSuccessful();

        // Get new settings
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room'=>$room]))
            ->assertSuccessful();

        $new_settings = $response->json('data');

        $this->assertJsonStringEqualsJsonString(json_encode($new_settings), json_encode($settings));
    }

    public function testUpdateSettingsInvalid()
    {
        $room = factory(Room::class)->create();
        // Get current settings
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.settings', ['room'=>$room]))
            ->assertSuccessful();

        $settings = $response->json('data');

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
    public function testStartOnlyModeratorsNoServer()
    {
        $room = factory(Room::class)->create([
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);

        // Testing guests
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertForbidden();
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room,'code'=>$room->accessCode]))
            ->assertForbidden();

        // Testing authorized users
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertForbidden();
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room,'code'=>$room->accessCode]))
            ->assertForbidden();

        // Testing member
        $room->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertForbidden();

        // Testing member as moderator
        $room->members()->sync([$this->user->id,['role'=>RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);

        // Testing owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);
    }

    /**
     * Testing to start room with guests allowed, and everyone can start but no server available
     */
    public function testStartNoServer()
    {
        $room = factory(Room::class)->create([
            'allowGuests'      => true,
            'everyoneCanStart' => true,
            'accessCode'       => $this->faker->numberBetween(111111111, 999999999)
        ]);

        // Testing guests
        $this->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertUnauthorized();
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertJsonValidationErrors('name');
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.start', ['room'=>$room,'name'=>'<script>alert("HI");</script>']))
            ->assertJsonValidationErrors('name');
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.start', ['room'=>$room,'name'=>$this->faker->name]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);

        $this->flushHeaders();

        // Testing authorized users
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertUnauthorized();
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);

        $this->flushHeaders();

        // Testing owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);

        // Testing member
        $room->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertStatus(CustomStatusCodes::NO_SERVER_AVAILABLE);
    }

    public function testStartAndJoinWithWrongServerDetails()
    {
        $room = factory(Room::class)->create();

        // Adding fake server(s)
        $server              = new Server();
        $server->baseUrl     = $this->faker->url;
        $server->salt        = $this->faker->sha1;
        $server->status      = true;
        $server->description = $this->faker->word;
        $server->save();

        // Create meeting
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room]))
            ->assertStatus(CustomStatusCodes::ROOM_START_FAILED);

        // Create meeting
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room' => $room]))
            ->assertStatus(CustomStatusCodes::ROOM_START_FAILED);
    }

    /**
     * Tests starting new meeting with a running bbb server
     */
    public function testStartWithServer()
    {
        $room = factory(Room::class)->create();

        // Adding server(s)
        $this->seed('ServerSeeder');

        // Create meeting
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertSuccessful();
        $this->assertIsString($response->json('url'));

        // Try to start bbb meeting
        $response = Http::withOptions(['allow_redirects' => false])->get($response->json('url'));
        $this->assertEquals(302, $response->status());
        $this->assertArrayHasKey('Location', $response->headers());

        // Clear
        $this->assertTrue($room->runningMeeting()->end());
    }

    /**
     * Test joining a meeting with a running bbb server
     */
    public function testJoin()
    {
        $room = factory(Room::class)->create([
            'allowGuests' => true,
            'accessCode'  => $this->faker->numberBetween(111111111, 999999999)
        ]);

        // Adding server(s)
        $this->seed('ServerSeeder');

        // Testing join with meeting not running
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room]))
            ->assertStatus(CustomStatusCodes::MEETING_NOT_RUNNING);

        // Start meeting
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertSuccessful();
        $this->assertIsString($response->json('url'));

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
        $this->getJson(route('api.v1.rooms.join', ['room'=>$room]))
            ->assertForbidden();

        // Join as guest without name
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.join', ['room'=>$room]))
            ->assertJsonValidationErrors('name');

        // Join as guest with invalid/dangerous name
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.join', ['room'=>$room,'name'=>'<script>alert("HI");</script>']))
            ->assertJsonValidationErrors('name');

        // Join as guest
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.join', ['room'=>$room,'name'=>$this->faker->name]))
            ->assertSuccessful();

        $this->flushHeaders();

        // Join as authorized users
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room'=>$room]))
            ->assertForbidden();
        $this->withHeaders(['Access-Code' => $this->faker->numberBetween(111111111, 999999999)])->getJson(route('api.v1.rooms.join', ['room'=>$room]))
            ->assertUnauthorized();
        $this->withHeaders(['Access-Code' => $room->accessCode])->getJson(route('api.v1.rooms.join', ['room'=>$room]))
            ->assertSuccessful();

        $this->flushHeaders();

        // Testing owner
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.join', ['room'=>$room]))
            ->assertSuccessful();

        // Testing member
        $room->members()->attach($this->user, ['role'=>RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.join', ['room'=>$room]))
            ->assertSuccessful();

        // Clear
        $this->assertTrue($room->runningMeeting()->end());
    }

    /**
     * Test lobby behavior if enabled for everyone
     */
    public function testLobbyEnabled()
    {
        $room = factory(Room::class)->create([
            'allowGuests' => true,
            'lobby'       => RoomLobby::ENABLED,
        ]);

        // Adding server(s)
        $this->seed('ServerSeeder');

        // Start meeting
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
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

        // Clear
        $this->assertTrue($room->runningMeeting()->end());
    }

    /**
     * Test lobby behavior if enabled only for guests
     */
    public function testLobbyOnlyGuests()
    {
        $room = factory(Room::class)->create([
            'allowGuests' => true,
            'lobby'       => RoomLobby::ONLY_GUEST,
        ]);
        // Adding server(s)
        $this->seed('ServerSeeder');

        // Start meeting
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
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

        // Clear
        $this->assertTrue($room->runningMeeting()->end());
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
        $response = $request->getJson(route('api.v1.rooms.join', ['room'=>$room,'code'=>$room->accessCode,'name'=>$this->faker->name]))
            ->assertSuccessful();
        // check if response has a join url
        $this->assertIsString($response->json('url'));
        // check if join url is working
        $response        = Http::withOptions(['allow_redirects' =>['track_redirects' => true]])->get($response->json('url'));
        $headersRedirect = $response->getHeader(\GuzzleHttp\RedirectMiddleware::HISTORY_HEADER);
        $this->assertNotEmpty($headersRedirect);

        return Str::contains(last($headersRedirect), 'guest-wait.html');
    }
}
