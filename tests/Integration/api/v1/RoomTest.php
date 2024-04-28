<?php

namespace Tests\Integration\api\v1;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Models\Meeting;
use App\Models\Room;
use App\Models\RoomType;
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
        $this->user = User::factory()->create([
            'bbb_skip_check_audio' => true,
        ]);

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /**
     * Test lobby behavior if enabled for everyone and enforced by room type
     */
    public function testLobbyEnabledEnforced() //ToDo add other cases
    {
        $roomTypeLobbyEnabledEnforced = RoomType::factory()->create([
            'lobby_default' => RoomLobby::ENABLED,
            'lobby_enforced' => true,
        ]);

        $room = Room::factory()->create([
            'expert_mode' => true,
            'allow_guests' => true,
            'lobby' => RoomLobby::ENABLED,
        ]);

        $room->roomType()->associate($roomTypeLobbyEnabledEnforced);
        $room->save();

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Start meeting
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 1]))
            ->assertSuccessful();

        // Check guests
        $this->assertTrue($this->checkGuestWaitPage($room));

        // Check auth. users
        $this->assertTrue($this->checkGuestWaitPage($room, $this->user));

        // Check owner
        $this->assertFalse($this->checkGuestWaitPage($room, $room->owner));

        // Testing member
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->assertTrue($this->checkGuestWaitPage($room, $this->user));

        // Testing moderator member
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Testing co-owner member
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Clear
        $room->refresh();
        (new MeetingService($room->latestMeeting))->end();
    }

    /**
     * Test lobby behavior if enabled for everyone when expert mode is activated
     */
    public function testLobbyEnabledExpertMode() // ToDo add other cases
    {
        $roomTypeLobbyDisabledDefault = RoomType::factory()->create([
            'lobby_default' => RoomLobby::DISABLED,
            'lobby_enforced' => false,
        ]);

        $room = Room::factory()->create([
            'expert_mode' => true,
            'allow_guests' => true,
            'lobby' => RoomLobby::ENABLED,
        ]);

        $room->roomType()->associate($roomTypeLobbyDisabledDefault);
        $room->save();

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Start meeting
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 1]))
            ->assertSuccessful();

        // Check guests
        $this->assertTrue($this->checkGuestWaitPage($room));

        // Check auth. users
        $this->assertTrue($this->checkGuestWaitPage($room, $this->user));

        // Check owner
        $this->assertFalse($this->checkGuestWaitPage($room, $room->owner));

        // Testing member
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->assertTrue($this->checkGuestWaitPage($room, $this->user));

        // Testing moderator member
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Testing co-owner member
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Clear
        $room->refresh();
        (new MeetingService($room->latestMeeting))->end();
    }

    /**
     * Test lobby behavior if enabled for everyone when expert mode is deactivated
     */
    public function testLobbyEnabledWithoutExpertMode()
    {
        $roomTypeLobbyEnabledDefault = RoomType::factory()->create([
            'lobby_default' => RoomLobby::ENABLED,
            'lobby_enforced' => false,
        ]);

        $room = Room::factory()->create([
            'expert_mode' => false,
            'allow_guests' => true,
        ]);

        $room->roomType()->associate($roomTypeLobbyEnabledDefault);
        $room->save();

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Start meeting
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 1]))
            ->assertSuccessful();

        // Check guests
        $this->assertTrue($this->checkGuestWaitPage($room));

        // Check auth. users
        $this->assertTrue($this->checkGuestWaitPage($room, $this->user));

        // Check owner
        $this->assertFalse($this->checkGuestWaitPage($room, $room->owner));

        // Testing member
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->assertTrue($this->checkGuestWaitPage($room, $this->user));

        // Testing moderator member
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Testing co-owner member
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Clear
        $room->refresh();
        (new MeetingService($room->latestMeeting))->end();
    }

    /**
     * Test lobby behavior if enabled only for guests and enforced by room type
     */
    public function testLobbyOnlyGuestsEnforced() //ToDo add other cases
    {
        $roomTypeLobbyOnlyGuestsEnforced = RoomType::factory()->create([
            'lobby_default' => RoomLobby::ONLY_GUEST,
            'lobby_enforced' => true,
        ]);

        $room = Room::factory()->create([
            'expert_mode' => true,
            'allow_guests' => true,
            'lobby' => RoomLobby::DISABLED,
        ]);

        $room->roomType()->associate($roomTypeLobbyOnlyGuestsEnforced);
        $room->save();

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Start meeting
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 1]))
            ->assertSuccessful();

        // Check guests
        $this->assertTrue($this->checkGuestWaitPage($room));

        // Check auth. users
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Check owner
        $this->assertFalse($this->checkGuestWaitPage($room, $room->owner));

        // Testing member
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Testing moderator member
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Testing co-owner member
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Clear
        $room->refresh();
        (new MeetingService($room->latestMeeting))->end();
    }

    /**
     * Test lobby behavior if enabled only for guests when expert mode is activated
     */
    public function testLobbyOnlyGuestsExpertMode() //ToDo add other cases
    {
        $roomTypeLobbyDisabledDefault = RoomType::factory()->create([
            'lobby_default' => RoomLobby::DISABLED,
            'lobby_enforced' => false,
        ]);

        $room = Room::factory()->create([
            'expert_mode' => true,
            'allow_guests' => true,
            'lobby' => RoomLobby::ONLY_GUEST,
        ]);

        $room->roomType()->associate($roomTypeLobbyDisabledDefault);
        $room->save();

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Start meeting
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 1]))
            ->assertSuccessful();

        // Check guests
        $this->assertTrue($this->checkGuestWaitPage($room));

        // Check auth. users
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Check owner
        $this->assertFalse($this->checkGuestWaitPage($room, $room->owner));

        // Testing member
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Testing moderator member
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Testing co-owner member
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Clear
        $room->refresh();
        (new MeetingService($room->latestMeeting))->end();
    }

    /**
     * Test lobby behavior if enabled only for guests when expert mode is deactivated
     */
    public function testLobbyOnlyGuestsWithoutExpertMode()
    {
        $roomTypeLobbyOnlyGuestsDefault = RoomType::factory()->create([
            'lobby_default' => RoomLobby::ONLY_GUEST,
            'lobby_enforced' => false,
        ]);

        $room = Room::factory()->create([
            'expert_mode' => false,
            'allow_guests' => true,
        ]);

        $room->roomType()->associate($roomTypeLobbyOnlyGuestsDefault);
        $room->save();

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Start meeting
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room' => $room, 'record_attendance' => 1]))
            ->assertSuccessful();

        // Check guests
        $this->assertTrue($this->checkGuestWaitPage($room));

        // Check auth. users
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Check owner
        $this->assertFalse($this->checkGuestWaitPage($room, $room->owner));

        // Testing member
        $room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Testing moderator member
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Testing co-owner member
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->assertFalse($this->checkGuestWaitPage($room, $this->user));

        // Clear
        $room->refresh();
        (new MeetingService($room->latestMeeting))->end();
    }

    /**
     * Check if user or guest enters room or lobby
     *
     * @param  Room  $room  Room
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
        $response = $request->getJson(route('api.v1.rooms.join', ['room' => $room, 'name' => $this->faker->name, 'record_attendance' => 1]))
            ->assertSuccessful();
        // check if response has a join url
        $this->assertIsString($response->json('url'));
        // check if join url is working
        $response = LaravelHTTPClient::httpClient()->withOptions(['allow_redirects' => ['track_redirects' => true]])->get($response->json('url'));
        $headersRedirect = $response->getHeader(\GuzzleHttp\RedirectMiddleware::HISTORY_HEADER);
        $this->assertNotEmpty($headersRedirect);

        return Str::contains(last($headersRedirect), 'guestWait');
    }
}
