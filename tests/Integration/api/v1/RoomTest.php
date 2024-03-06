<?php

namespace Tests\Integration\api\v1;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Models\Meeting;
use App\Models\Room;
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

    protected $user;

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
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
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
        $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
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
        $response = $request->getJson(route('api.v1.rooms.join', ['room'=>$room,'code'=>$room->access_code,'name'=>$this->faker->name, 'record_attendance' => 0, 'record' => 0, 'record_video' => 0]))
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
