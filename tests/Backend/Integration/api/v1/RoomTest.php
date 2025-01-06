<?php

namespace Tests\Backend\Integration\api\v1;

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
use Tests\Backend\TestCase;

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
    public function test_lobby_enabled_enforced()
    {
        $roomTypeLobbyEnabledEnforced = RoomType::factory()->create([
            'lobby_default' => RoomLobby::ENABLED,
            'lobby_enforced' => true,
            'allow_guests_default' => true,
            'allow_guests_enforced' => true,
        ]);

        $room1 = Room::factory()->create([
            'expert_mode' => true,
            'lobby' => RoomLobby::DISABLED,
            'room_type_id' => $roomTypeLobbyEnabledEnforced->id,
        ]);

        $room2 = Room::factory()->create([
            'expert_mode' => true,
            'lobby' => RoomLobby::ENABLED,
            'room_type_id' => $roomTypeLobbyEnabledEnforced->id,

        ]);

        $room3 = Room::factory()->create([
            'expert_mode' => false,
            'room_type_id' => $roomTypeLobbyEnabledEnforced->id,
        ]);

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Start meeting
        $this->actingAs($room1->owner)->postJson(route('api.v1.rooms.start', ['room' => $room1]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        $this->actingAs($room2->owner)->postJson(route('api.v1.rooms.start', ['room' => $room2]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        $this->actingAs($room3->owner)->postJson(route('api.v1.rooms.start', ['room' => $room3]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Check guests
        $this->assertTrue($this->checkGuestWaitPage($room1));
        $this->assertTrue($this->checkGuestWaitPage($room2));
        $this->assertTrue($this->checkGuestWaitPage($room3));

        // Check auth. users
        $this->assertTrue($this->checkGuestWaitPage($room1, $this->user));
        $this->assertTrue($this->checkGuestWaitPage($room2, $this->user));
        $this->assertTrue($this->checkGuestWaitPage($room3, $this->user));

        // Check owner
        $this->assertFalse($this->checkGuestWaitPage($room1, $room1->owner));
        $this->assertFalse($this->checkGuestWaitPage($room2, $room2->owner));
        $this->assertFalse($this->checkGuestWaitPage($room3, $room3->owner));

        // Testing member
        $room1->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $room2->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $room3->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->assertTrue($this->checkGuestWaitPage($room1, $this->user));
        $this->assertTrue($this->checkGuestWaitPage($room2, $this->user));
        $this->assertTrue($this->checkGuestWaitPage($room3, $this->user));

        // Testing moderator member
        $room1->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $room2->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $room3->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->assertFalse($this->checkGuestWaitPage($room1, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room2, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room3, $this->user));

        // Testing co-owner member
        $room1->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $room2->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $room3->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->assertFalse($this->checkGuestWaitPage($room1, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room2, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room3, $this->user));

        // Clear
        $room1->refresh();
        $room2->refresh();
        $room3->refresh();
        (new MeetingService($room1->latestMeeting))->end();
        (new MeetingService($room2->latestMeeting))->end();
        (new MeetingService($room3->latestMeeting))->end();
    }

    /**
     * Test lobby behavior if enabled for everyone when expert mode is activated
     */
    public function test_lobby_enabled_expert_mode()
    {
        $roomTypeLobbyDisabledDefault = RoomType::factory()->create([
            'lobby_default' => RoomLobby::DISABLED,
            'lobby_enforced' => false,
        ]);
        $roomTypeLobbyEnabledDefault = RoomType::factory()->create([
            'lobby_default' => RoomLobby::ENABLED,
            'lobby_enforced' => false,
        ]);

        $room1 = Room::factory()->create([
            'expert_mode' => true,
            'allow_guests' => true,
            'lobby' => RoomLobby::ENABLED,
            'room_type_id' => $roomTypeLobbyDisabledDefault->id,
        ]);

        $room2 = Room::factory()->create([
            'expert_mode' => true,
            'allow_guests' => true,
            'lobby' => RoomLobby::ENABLED,
            'room_type_id' => $roomTypeLobbyEnabledDefault->id,
        ]);

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Start meeting
        $this->actingAs($room1->owner)->postJson(route('api.v1.rooms.start', ['room' => $room1]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $this->actingAs($room2->owner)->postJson(route('api.v1.rooms.start', ['room' => $room2]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Check guests
        $this->assertTrue($this->checkGuestWaitPage($room1));
        $this->assertTrue($this->checkGuestWaitPage($room2));

        // Check auth. users
        $this->assertTrue($this->checkGuestWaitPage($room1, $this->user));
        $this->assertTrue($this->checkGuestWaitPage($room2, $this->user));

        // Check owner
        $this->assertFalse($this->checkGuestWaitPage($room1, $room1->owner));
        $this->assertFalse($this->checkGuestWaitPage($room2, $room2->owner));

        // Testing member
        $room1->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $room2->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->assertTrue($this->checkGuestWaitPage($room1, $this->user));
        $this->assertTrue($this->checkGuestWaitPage($room2, $this->user));

        // Testing moderator member
        $room1->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $room2->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->assertFalse($this->checkGuestWaitPage($room1, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room2, $this->user));

        // Testing co-owner member
        $room1->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $room2->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->assertFalse($this->checkGuestWaitPage($room1, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room2, $this->user));

        // Clear
        $room1->refresh();
        $room2->refresh();
        (new MeetingService($room1->latestMeeting))->end();
        (new MeetingService($room2->latestMeeting))->end();
    }

    /**
     * Test lobby behavior if enabled for everyone when expert mode is deactivated
     */
    public function test_lobby_enabled_without_expert_mode()
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
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
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
    public function test_lobby_only_guests_enforced()
    {
        $roomTypeLobbyOnlyGuestsEnforced = RoomType::factory()->create([
            'lobby_default' => RoomLobby::ONLY_GUEST,
            'lobby_enforced' => true,
            'allow_guests_default' => true,
            'allow_guests_enforced' => true,
        ]);

        $room1 = Room::factory()->create([
            'expert_mode' => true,
            'lobby' => RoomLobby::DISABLED,
            'room_type_id' => $roomTypeLobbyOnlyGuestsEnforced,
        ]);

        $room2 = Room::factory()->create([
            'expert_mode' => true,
            'lobby' => RoomLobby::ONLY_GUEST,
            'room_type_id' => $roomTypeLobbyOnlyGuestsEnforced,
        ]);

        $room3 = Room::factory()->create([
            'expert_mode' => false,
            'room_type_id' => $roomTypeLobbyOnlyGuestsEnforced,
        ]);

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Start meeting
        $this->actingAs($room1->owner)->postJson(route('api.v1.rooms.start', ['room' => $room1]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $this->actingAs($room2->owner)->postJson(route('api.v1.rooms.start', ['room' => $room2]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $this->actingAs($room3->owner)->postJson(route('api.v1.rooms.start', ['room' => $room3]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Check guests
        $this->assertTrue($this->checkGuestWaitPage($room1));
        $this->assertTrue($this->checkGuestWaitPage($room2));
        $this->assertTrue($this->checkGuestWaitPage($room3));

        // Check auth. users
        $this->assertFalse($this->checkGuestWaitPage($room1, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room2, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room3, $this->user));

        // Check owner
        $this->assertFalse($this->checkGuestWaitPage($room1, $room1->owner));
        $this->assertFalse($this->checkGuestWaitPage($room2, $room2->owner));
        $this->assertFalse($this->checkGuestWaitPage($room3, $room3->owner));

        // Testing member
        $room1->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $room2->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $room3->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->assertFalse($this->checkGuestWaitPage($room1, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room2, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room3, $this->user));

        // Testing moderator member
        $room1->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $room2->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $room3->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->assertFalse($this->checkGuestWaitPage($room1, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room2, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room3, $this->user));

        // Testing co-owner member
        $room1->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $room2->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $room3->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->assertFalse($this->checkGuestWaitPage($room1, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room2, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room3, $this->user));

        // Clear
        $room1->refresh();
        $room2->refresh();
        $room3->refresh();
        (new MeetingService($room1->latestMeeting))->end();
        (new MeetingService($room2->latestMeeting))->end();
        (new MeetingService($room3->latestMeeting))->end();
    }

    /**
     * Test lobby behavior if enabled only for guests when expert mode is activated
     */
    public function test_lobby_only_guests_expert_mode()
    {
        $roomTypeLobbyDisabledDefault = RoomType::factory()->create([
            'lobby_default' => RoomLobby::DISABLED,
            'lobby_enforced' => false,
        ]);
        $roomTypeLobbyOnlyGuestsDefault = RoomType::factory()->create([
            'lobby_default' => RoomLobby::ONLY_GUEST,
            'lobby_enforced' => false,
        ]);

        $room1 = Room::factory()->create([
            'expert_mode' => true,
            'allow_guests' => true,
            'lobby' => RoomLobby::ONLY_GUEST,
            'room_type_id' => $roomTypeLobbyDisabledDefault->id,
        ]);

        $room2 = Room::factory()->create([
            'expert_mode' => true,
            'allow_guests' => true,
            'lobby' => RoomLobby::ONLY_GUEST,
            'room_type_id' => $roomTypeLobbyOnlyGuestsDefault->id,
        ]);

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Start meeting
        $this->actingAs($room1->owner)->postJson(route('api.v1.rooms.start', ['room' => $room1]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $this->actingAs($room2->owner)->postJson(route('api.v1.rooms.start', ['room' => $room2]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Check guests
        $this->assertTrue($this->checkGuestWaitPage($room1));
        $this->assertTrue($this->checkGuestWaitPage($room2));

        // Check auth. users
        $this->assertFalse($this->checkGuestWaitPage($room1, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room2, $this->user));

        // Check owner
        $this->assertFalse($this->checkGuestWaitPage($room1, $room1->owner));
        $this->assertFalse($this->checkGuestWaitPage($room2, $room2->owner));

        // Testing member
        $room1->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $room2->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->assertFalse($this->checkGuestWaitPage($room1, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room2, $this->user));

        // Testing moderator member
        $room1->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $room2->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->assertFalse($this->checkGuestWaitPage($room1, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room2, $this->user));

        // Testing co-owner member
        $room2->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $room2->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->assertFalse($this->checkGuestWaitPage($room1, $this->user));
        $this->assertFalse($this->checkGuestWaitPage($room2, $this->user));

        // Clear
        $room1->refresh();
        $room2->refresh();
        (new MeetingService($room1->latestMeeting))->end();
        (new MeetingService($room2->latestMeeting))->end();
    }

    /**
     * Test lobby behavior if enabled only for guests when expert mode is deactivated
     */
    public function test_lobby_only_guests_without_expert_mode()
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
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
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
        // request as a user if a user is provided, otherwise request as a guest
        $request = $user == null ? $this : $this->actingAs($user);
        // join meeting
        $response = $request->postJson(route('api.v1.rooms.join', ['room' => $room]), ['name' => $this->faker->name, 'consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
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
