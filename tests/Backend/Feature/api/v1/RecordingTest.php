<?php

namespace Tests\Backend\Feature\api\v1;

use App\Enums\RecordingAccess;
use App\Enums\RoomUserRole;
use App\Models\Permission;
use App\Models\Recording;
use App\Models\RecordingFormat;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomToken;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Storage;
use Tests\Backend\TestCase;
use Tests\Backend\Utils\FileHelper;
use ZipArchive;

/**
 * Recording tests
 */
class RecordingTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    protected $role;

    protected $viewAllPermission;

    protected $managePermission;

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->role = Role::factory()->create();
        $this->viewAllPermission = Permission::where('name', 'rooms.viewAll')->first();
        $this->managePermission = Permission::where('name', 'rooms.manage')->first();
    }

    public function test_index_no_access_code_guests_allowed()
    {
        $page_size = 20;
        $this->generalSettings->pagination_page_size = $page_size;
        $this->generalSettings->save();

        $room = Room::factory()->create();
        $room->allow_guests = true;
        $room->access_code = null;
        $room->save();

        Recording::factory()->count(7)->create(['room_id' => $room->id, 'access' => RecordingAccess::OWNER]);
        Recording::factory()->count(6)->create(['room_id' => $room->id, 'access' => RecordingAccess::MODERATOR]);
        Recording::factory()->count(3)->create(['room_id' => $room->id, 'access' => RecordingAccess::PARTICIPANT]);
        Recording::factory()->count(2)->create(['room_id' => $room->id, 'access' => RecordingAccess::EVERYONE]);

        foreach (Recording::all() as $recording) {
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);
        }

        // Access as guest, only show public recordings
        $this->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(2, 'data');

        // Access as authenticated user, only show public recordings
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(2, 'data');

        // Access as member, show public recordings + participant recordings
        $room->members()->attach($this->user->id, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(5, 'data');

        // Access as moderator, show public recordings + participant recordings + moderator recordings
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(11, 'data');

        // Access as co-owner, show all recordings
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(18, 'data');

        // Access as owner, show all recordings
        $this->actingAs($room->owner)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(18, 'data');
    }

    public function test_index_with_access_code_guests_allowed()
    {
        $page_size = 20;
        $this->generalSettings->pagination_page_size = $page_size;
        $this->generalSettings->save();

        $room = Room::factory()->create();
        $room->allow_guests = true;
        $room->access_code = $this->faker->numberBetween(111111111, 999999999);
        $room->save();

        Recording::factory()->count(7)->create(['room_id' => $room->id, 'access' => RecordingAccess::OWNER]);
        Recording::factory()->count(6)->create(['room_id' => $room->id, 'access' => RecordingAccess::MODERATOR]);
        Recording::factory()->count(3)->create(['room_id' => $room->id, 'access' => RecordingAccess::PARTICIPANT]);
        Recording::factory()->count(2)->create(['room_id' => $room->id, 'access' => RecordingAccess::EVERYONE]);

        foreach (Recording::all() as $recording) {
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);
        }

        // Access as guest without access code
        $this->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertForbidden();

        // Access as guest with wrong access code
        $this->withHeaders(['Access-Code' => 111])
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertUnauthorized();

        // Access as guest with correct access code
        $this->withHeaders(['Access-Code' => $room->access_code])
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(2, 'data');
        $this->flushHeaders();

        // Access as authenticated user, without access code
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertForbidden();

        // Access as authenticated user, with wrong access code
        $this->actingAs($this->user)
            ->withHeaders(['Access-Code' => 111])
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertUnauthorized();

        // Access as authenticated user, with correct access code but only show public recordings
        $this->actingAs($this->user)
            ->withHeaders(['Access-Code' => $room->access_code])
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(2, 'data');
        $this->flushHeaders();

        // Access as member, show public recordings + participant recordings
        $room->members()->attach($this->user->id, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(5, 'data');

        // Access as moderator, show public recordings + participant recordings + moderator recordings
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(11, 'data');

        // Access as co-owner, show all recordings
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(18, 'data');

        // Access as owner, show all recordings
        $this->actingAs($room->owner)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(18, 'data');
    }

    public function test_index_with_access_code_guests_not_allowed()
    {
        $page_size = 20;
        $this->generalSettings->pagination_page_size = $page_size;
        $this->generalSettings->save();

        $room = Room::factory()->create();
        $room->allow_guests = false;
        $room->access_code = $this->faker->numberBetween(111111111, 999999999);
        $room->save();

        Recording::factory()->count(7)->create(['room_id' => $room->id, 'access' => RecordingAccess::OWNER]);
        Recording::factory()->count(6)->create(['room_id' => $room->id, 'access' => RecordingAccess::MODERATOR]);
        Recording::factory()->count(3)->create(['room_id' => $room->id, 'access' => RecordingAccess::PARTICIPANT]);
        Recording::factory()->count(2)->create(['room_id' => $room->id, 'access' => RecordingAccess::EVERYONE]);

        foreach (Recording::all() as $recording) {
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);
        }

        // Access as guest with correct access code
        $this->withHeaders(['Access-Code' => $room->access_code])
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertForbidden();
        $this->flushHeaders();

        // Access as authenticated user, without access code
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertForbidden();

        // Access as authenticated user, with correct access
        $this->actingAs($this->user)
            ->withHeaders(['Access-Code' => $room->access_code])
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(2, 'data');
        $this->flushHeaders();
    }

    public function test_index_pagination()
    {
        $page_size = 5;
        $this->generalSettings->pagination_page_size = $page_size;
        $this->generalSettings->save();

        $room = Room::factory()->create();
        $room->allow_guests = false;
        $room->access_code = $this->faker->numberBetween(111111111, 999999999);
        $room->save();

        Recording::factory()->count(7)->create(['room_id' => $room->id, 'access' => RecordingAccess::OWNER]);
        Recording::factory()->count(6)->create(['room_id' => $room->id, 'access' => RecordingAccess::MODERATOR]);
        Recording::factory()->count(3)->create(['room_id' => $room->id, 'access' => RecordingAccess::PARTICIPANT]);
        Recording::factory()->count(2)->create(['room_id' => $room->id, 'access' => RecordingAccess::EVERYONE]);

        foreach (Recording::all() as $recording) {
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);
        }

        $this->actingAs($room->owner)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.total', 18);

        $this->actingAs($room->owner)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id, 'page' => 4]))
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.current_page', 4);

    }

    public function test_index_only_list_with_format()
    {
        $page_size = 5;
        $this->generalSettings->pagination_page_size = $page_size;
        $this->generalSettings->save();

        $room = Room::factory()->create();
        $room->save();

        $recordings = Recording::factory()->count(3)->create(['room_id' => $room->id, 'access' => RecordingAccess::PARTICIPANT]);

        // Add formats to first recording
        RecordingFormat::factory()->create(['recording_id' => $recordings[0]->id, 'format' => 'notes']);
        RecordingFormat::factory()->create(['recording_id' => $recordings[0]->id, 'format' => 'podcast']);
        // Add formats to second recording but disable them
        RecordingFormat::factory()->create(['recording_id' => $recordings[1]->id, 'format' => 'notes', 'disabled' => true]);
        RecordingFormat::factory()->create(['recording_id' => $recordings[1]->id, 'format' => 'podcast', 'disabled' => true]);

        // Check if owner can see all recordings with at least one format, even with only disabled formats
        $this->actingAs($room->owner)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(2, 'data');

        // Check if users can see only recordings with at least one enabled format
        $room->members()->attach($this->user->id, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_index_room_token()
    {
        $page_size = 20;
        $this->generalSettings->pagination_page_size = $page_size;
        $this->generalSettings->save();

        $room = Room::factory()->create();
        $room->allow_guests = false;
        $room->access_code = $this->faker->numberBetween(111111111, 999999999);
        $room->save();

        Recording::factory()->count(7)->create(['room_id' => $room->id, 'access' => RecordingAccess::OWNER]);
        Recording::factory()->count(6)->create(['room_id' => $room->id, 'access' => RecordingAccess::MODERATOR]);
        Recording::factory()->count(3)->create(['room_id' => $room->id, 'access' => RecordingAccess::PARTICIPANT]);
        Recording::factory()->count(2)->create(['room_id' => $room->id, 'access' => RecordingAccess::EVERYONE]);

        foreach (Recording::all() as $recording) {
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);
        }

        // Create token
        $token = RoomToken::factory()->create(['room_id' => $room->id]);
        $token->role = RoomUserRole::USER;
        $token->save();

        // Access as guest with token with room participant role
        $this->withHeaders(['Token' => $token->token])
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertSuccessful()
            ->assertJsonCount(5, 'data');

        // Increase token role to moderator
        $token->role = RoomUserRole::MODERATOR;
        $token->save();

        // Access as guest with token with room moderator role
        $this->withHeaders(['Token' => $token->token])
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertSuccessful()
            ->assertJsonCount(11, 'data');
    }

    public function test_show_no_access_code_guests_allowed()
    {
        $format = RecordingFormat::factory()->create(['format' => 'podcast']);
        $recording = $format->recording;
        $room = $recording->room;

        $recording->access = RecordingAccess::EVERYONE;
        $recording->save();

        $room->allow_guests = true;
        $room->access_code = null;
        $room->save();

        // Access as guest without access code
        $this->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertOk();
    }

    public function test_show_access_code_guests_allowed()
    {
        $format = RecordingFormat::factory()->create(['format' => 'podcast']);
        $recording = $format->recording;
        $room = $recording->room;

        $recording->access = RecordingAccess::EVERYONE;
        $recording->save();

        $room->allow_guests = true;
        $room->access_code = $this->faker->numberBetween(111111111, 999999999);
        $room->save();

        // Access as guest without access code
        $this->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertForbidden();

        // Access as guest with wrong access code
        $this->withHeaders(['Access-Code' => 111])
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertUnauthorized();

        // Access as guest with correct access code
        $this->withHeaders(['Access-Code' => $room->access_code])
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertOk();
    }

    public function test_show_access_code_guests_not_allowed()
    {
        $format = RecordingFormat::factory()->create(['format' => 'podcast']);
        $recording = $format->recording;
        $room = $recording->room;

        $recording->access = RecordingAccess::EVERYONE;
        $recording->save();

        $room->allow_guests = false;
        $room->access_code = $this->faker->numberBetween(111111111, 999999999);
        $room->save();

        // Access as guest with correct access code
        $this->withHeaders(['Access-Code' => $room->access_code])
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertForbidden();
    }

    public function test_show_room_token()
    {
        $format = RecordingFormat::factory()->create(['format' => 'podcast']);
        $recording = $format->recording;
        $room = $recording->room;

        $recording->access = RecordingAccess::EVERYONE;
        $recording->save();

        $room->allow_guests = false;
        $room->access_code = $this->faker->numberBetween(111111111, 999999999);
        $room->save();

        // Create token
        $token = RoomToken::factory()->create(['room_id' => $room->id]);
        $token->role = RoomUserRole::USER;
        $token->save();

        // Access as guest with token with room participant role
        $this->withHeaders(['Token' => $token->token])
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertSuccessful();

        // Increase recording access to participant
        $recording->access = RecordingAccess::PARTICIPANT;
        $recording->save();

        // Access as guest with token with room participant role
        $this->withHeaders(['Token' => $token->token])
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertSuccessful();

        // Increase recording access to moderator
        $recording->access = RecordingAccess::MODERATOR;
        $recording->save();

        // Access as guest with token with room participant role
        $this->withHeaders(['Token' => $token->token])
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertForbidden();

        // Increase token role to moderator
        $token->role = RoomUserRole::MODERATOR;
        $token->save();

        // Access as guest with token with room moderator role
        $this->withHeaders(['Token' => $token->token])
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertSuccessful();

        // Increase recording access to owner
        $recording->access = RecordingAccess::OWNER;
        $recording->save();

        // Access as guest with token with room moderator role
        $this->withHeaders(['Token' => $token->token])
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertForbidden();
    }

    public function test_show_disabled_format()
    {
        $format = RecordingFormat::factory()->create(['format' => 'podcast']);
        $recording = $format->recording;
        $room = $recording->room;

        $recording->access = RecordingAccess::PARTICIPANT;
        $recording->save();

        // User is room member
        $room->members()->attach($this->user->id, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertOk();

        // Disable format
        $format->disabled = true;
        $format->save();

        // Try to access disabled format
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertForbidden();

        // Test owner can access disabled format
        $this->actingAs($room->owner)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertOk();
    }

    public function test_show_access()
    {
        $format = RecordingFormat::factory()->create(['format' => 'podcast']);
        $recording = $format->recording;
        $room = $recording->room;

        $otherUser = User::factory()->create();

        $room->allow_guests = true;
        $room->access_code = null;
        $room->save();

        $recording->access = RecordingAccess::EVERYONE;
        $recording->save();

        // Guest can access
        $this->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertOk();

        // Every user can access
        $this->actingAs($otherUser)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertOk();
        Auth::logout();

        // Change access
        $recording->access = RecordingAccess::PARTICIPANT;
        $recording->save();

        // Try to access again as guests
        $this->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertForbidden();

        //  Try to access again as normal user
        $this->actingAs($otherUser)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertForbidden();
        Auth::logout();

        // Try as room member
        $room->members()->attach($this->user->id, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertOk();

        // Change access
        $recording->access = RecordingAccess::MODERATOR;
        $recording->save();

        // Try to access again
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertForbidden();

        // Test user with higher role can access
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertOk();

        // Change access
        $recording->access = RecordingAccess::OWNER;
        $recording->save();

        // Try to access again
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertForbidden();

        // Test owner can access
        $this->actingAs($room->owner)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertOk();
    }

    public function test_show_wrong_format()
    {
        $format = RecordingFormat::factory()->create(['format' => 'podcast']);
        $recording = $format->recording;

        $otherRoom = Room::factory()->create();

        $this->actingAs($otherRoom->owner)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $otherRoom->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertNotFound();
    }

    public function test_show_url()
    {
        $format = RecordingFormat::factory()->create(['format' => 'podcast']);
        $recording = $format->recording;
        $room = $recording->room;

        // Check url is pointing to the resource route (for all formats except presentation)
        $this->actingAs($room->owner)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertOk()
            ->assertJson(['url' => route('recording.resource', ['formatName' => $format->format, 'recording' => $recording->id, 'resource' => 'audio.ogg'])]);

        // Check url is pointing to the player route (for presentation format)
        $format = RecordingFormat::factory()->create(['format' => 'presentation']);
        $recording = $format->recording;
        $room = $recording->room;

        config(['recording.player' => 'https://example.com/player']);

        $this->actingAs($room->owner)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertOk()
            ->assertJson(['url' => 'https://example.com/player/'.$recording->id.'/']);
    }

    public function test_update()
    {
        $recording = Recording::factory()->create();
        $room = $recording->room;

        $podcast = RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);
        $presentation = RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'presentation']);
        $notes = RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);

        $payload = [
            'description' => 'New description',
            'access' => RecordingAccess::PARTICIPANT,
            'formats' => [
                ['id' => $podcast->id, 'disabled' => true],
                ['id' => $presentation->id, 'disabled' => false],
                ['id' => $notes->id, 'disabled' => true],
            ],
        ];

        $this->actingAs($room->owner)
            ->putJson(route('api.v1.rooms.recordings.update', ['room' => $room->id, 'recording' => $recording->id]), $payload)
            ->assertOk()
            ->assertJsonFragment(['description' => 'New description'])
            ->assertJsonFragment(['access' => RecordingAccess::PARTICIPANT]);

        $podcast->refresh();
        $presentation->refresh();
        $notes->refresh();

        $this->assertTrue($podcast->disabled);
        $this->assertFalse($presentation->disabled);
        $this->assertTrue($notes->disabled);
    }

    public function test_update_permissions()
    {
        $recording = Recording::factory()->create();
        $room = $recording->room;

        $podcast = RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);
        $presentation = RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'presentation']);
        $notes = RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);

        $payload = [
            'description' => 'New description',
            'access' => RecordingAccess::PARTICIPANT,
            'formats' => [
                ['id' => $podcast->id, 'disabled' => true],
                ['id' => $presentation->id, 'disabled' => false],
                ['id' => $notes->id, 'disabled' => true],
            ],
        ];

        // Check user with manage rooms permission can update
        $this->role->permissions()->attach($this->managePermission);
        $this->user->roles()->attach($this->role);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.rooms.recordings.update', ['room' => $room->id, 'recording' => $recording->id]), $payload)
            ->assertOk();
        $this->role->permissions()->detach($this->managePermission);

        // Check user with viewAll rooms permission cannot update
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.rooms.recordings.update', ['room' => $room->id, 'recording' => $recording->id]), $payload)
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Check if co-owner can update
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.rooms.recordings.update', ['room' => $room->id, 'recording' => $recording->id]), $payload)
            ->assertOk();

        // Check if moderator cannot update
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.rooms.recordings.update', ['room' => $room->id, 'recording' => $recording->id]), $payload)
            ->assertForbidden();

        // Check if participant cannot update
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::USER]]);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.rooms.recordings.update', ['room' => $room->id, 'recording' => $recording->id]), $payload)
            ->assertForbidden();

        // Check if non-member cannot update
        $room->members()->detach($this->user->id);
        $this->actingAs($this->user)
            ->putJson(route('api.v1.rooms.recordings.update', ['room' => $room->id, 'recording' => $recording->id]), $payload)
            ->assertForbidden();

        // Check if guest cannot update
        Auth::logout();
        $this->putJson(route('api.v1.rooms.recordings.update', ['room' => $room->id, 'recording' => $recording->id]), $payload)
            ->assertUnauthorized();
    }

    public function test_update_invalid_data()
    {
        $recording = Recording::factory()->create();
        $room = $recording->room;

        $podcast = RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);
        $presentation = RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'presentation']);
        RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);

        $formatOtherRecording = RecordingFormat::factory()->create();

        $payload = [
            'description' => '',
            'access' => 'DEMO',
            'formats' => [
                ['id' => $podcast->id],
                ['id' => $presentation->id, 'disabled' => 'hello'],
                ['disabled' => true],
                ['id' => $formatOtherRecording->id, 'disabled' => true],
            ],
        ];

        $this->actingAs($room->owner)
            ->putJson(route('api.v1.rooms.recordings.update', ['room' => $room->id, 'recording' => $recording->id]), $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['description', 'access', 'formats.0.disabled', 'formats.1.disabled', 'formats.2.id', 'formats.3.id']);

        // Check updating recording with wrong room in url
        $otherRoom = Room::factory()->create();
        $this->actingAs($otherRoom->owner)
            ->putJson(route('api.v1.rooms.recordings.update', ['room' => $otherRoom->id, 'recording' => $recording->id]), $payload)
            ->assertNotFound();

    }

    public function test_delete()
    {
        Storage::fake('recordings');

        $recording = Recording::factory()->create();
        $room = $recording->room;

        // Create formats
        $notes = RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);
        $podcast = RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);

        // Create folder with recording files
        Storage::disk('recordings')->makeDirectory($recording->id);
        Storage::disk('recordings')->makeDirectory($recording->id.'/notes');
        UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf')->storeAs($recording->id.'/notes', 'notes.pdf', 'recordings');
        UploadedFile::fake()->create('audio.ogg', 100, 'audio/ogg')->storeAs($recording->id.'/podcast', 'audio.ogg', 'recordings');

        $this->actingAs($room->owner)
            ->deleteJson(route('api.v1.rooms.recordings.destroy', ['room' => $room->id, 'recording' => $recording->id]))
            ->assertNoContent();

        // Check database
        $this->assertModelMissing($recording);
        $this->assertModelMissing($notes);
        $this->assertModelMissing($podcast);

        // Check storage
        $this->assertDirectoryDoesNotExist(Storage::disk('recordings')->path($recording->id));
    }

    public function test_delete_on_room_delete()
    {
        Storage::fake('recordings');

        $recording = Recording::factory()->create();
        $room = $recording->room;

        // Create formats
        $notes = RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);
        $podcast = RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);

        // Create folder with recording files
        Storage::disk('recordings')->makeDirectory($recording->id);
        Storage::disk('recordings')->makeDirectory($recording->id.'/notes');
        UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf')->storeAs($recording->id.'/notes', 'notes.pdf', 'recordings');
        UploadedFile::fake()->create('audio.ogg', 100, 'audio/ogg')->storeAs($recording->id.'/podcast', 'audio.ogg', 'recordings');

        $this->actingAs($room->owner)
            ->deleteJson(route('api.v1.rooms.destroy', ['room' => $room->id]))
            ->assertNoContent();

        // Check database
        $this->assertModelMissing($room);
        $this->assertModelMissing($recording);
        $this->assertModelMissing($notes);
        $this->assertModelMissing($podcast);

        // Check storage
        $this->assertDirectoryDoesNotExist(Storage::disk('recordings')->path($recording->id));
    }

    public function test_delete_permissions()
    {

        // Check if user with manage rooms permission can delete
        $recording = Recording::factory()->create();
        $this->role->permissions()->attach($this->managePermission);
        $this->user->roles()->attach($this->role);
        $this->actingAs($this->user)
            ->deleteJson(route('api.v1.rooms.recordings.destroy', ['room' => $recording->room->id, 'recording' => $recording->id]))
            ->assertNoContent();
        $this->role->permissions()->detach($this->managePermission);

        // Check if user with viewAll rooms permission cannot delete
        $recording = Recording::factory()->create();
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)
            ->deleteJson(route('api.v1.rooms.recordings.destroy', ['room' => $recording->room->id, 'recording' => $recording->id]))
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);
        $this->user->roles()->detach($this->role);

        // Check if co-owner can delete
        $recording = Recording::factory()->create();
        $recording->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)
            ->deleteJson(route('api.v1.rooms.recordings.destroy', ['room' => $recording->room->id, 'recording' => $recording->id]))
            ->assertNoContent();

        // Check if moderator cannot delete
        $recording = Recording::factory()->create();
        $recording->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)
            ->deleteJson(route('api.v1.rooms.recordings.destroy', ['room' => $recording->room->id, 'recording' => $recording->id]))
            ->assertForbidden();

        // Check if participant cannot delete
        $recording = Recording::factory()->create();
        $recording->room->members()->sync([$this->user->id => ['role' => RoomUserRole::USER]]);
        $this->actingAs($this->user)
            ->deleteJson(route('api.v1.rooms.recordings.destroy', ['room' => $recording->room->id, 'recording' => $recording->id]))
            ->assertForbidden();

        // Check if non-member cannot delete
        $recording = Recording::factory()->create();
        $recording->room->members()->detach($this->user->id);
        $this->actingAs($this->user)
            ->deleteJson(route('api.v1.rooms.recordings.destroy', ['room' => $recording->room->id, 'recording' => $recording->id]))
            ->assertForbidden();

        // Check if guest cannot delete
        $recording = Recording::factory()->create();
        Auth::logout();
        $this->deleteJson(route('api.v1.rooms.recordings.destroy', ['room' => $recording->room->id, 'recording' => $recording->id]))
            ->assertUnauthorized();
    }

    public function test_delete_invalid_data()
    {
        $recording = Recording::factory()->create();

        // Check deleting recording with wrong room in url
        $otherRoom = Room::factory()->create();
        $this->actingAs($otherRoom->owner)
            ->deleteJson(route('api.v1.rooms.recordings.destroy', ['room' => $otherRoom->id, 'recording' => $recording->id]))
            ->assertNotFound();
    }

    /** Non-API Routes */
    public function test_access_recording_resource()
    {
        Storage::fake('recordings');

        $recording = Recording::factory()->create();
        $room = $recording->room;

        // Create format
        $notes = RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);

        // Create folder with recording files
        Storage::disk('recordings')->makeDirectory($recording->id);
        Storage::disk('recordings')->makeDirectory($recording->id.'/notes');
        Storage::disk('recordings')->makeDirectory($recording->id.'/podcast');
        UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf')->storeAs($recording->id.'/notes', 'notes.pdf', 'recordings');
        UploadedFile::fake()->create('audio.ogg', 100, 'audio/ogg')->storeAs($recording->id.'/podcast', 'audio.ogg', 'recordings');

        // Check url is pointing to the resource route
        $apiResponse = $this->actingAs($room->owner)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $notes->id]));

        $apiResponse->assertOk();

        $url = $apiResponse->json('url');

        // Access the resource
        $response = $this->actingAs($room->owner)->get($url);
        $response->assertSuccessful();

        // Check if file headers for reverse proxy are correctly set
        $this->assertEquals('/private-storage/recordings/'.$recording->id.'/notes/notes.pdf', $response->headers->get('x-accel-redirect'));

        // Try to path traversal
        $response = $this->actingAs($room->owner)->get(route('recording.resource', ['formatName' => 'notes', 'recording' => $recording->id, 'resource' => '../podcast/audio.ogg']));
        $response->assertNotFound();

        // Try invalid file
        $response = $this->actingAs($room->owner)->get(route('recording.resource', ['formatName' => 'notes', 'recording' => $recording->id, 'resource' => 'audio.ogg']));
        $response->assertNotFound();

        // Try to access other format
        $this->actingAs($room->owner)->get(route('recording.resource', ['formatName' => 'podcast', 'recording' => $recording->id, 'resource' => 'audio.ogg']))
            ->assertNotFound();

        // Check if permission to access the resource are bound to the session
        $this->flushSession();
        $response = $this->actingAs($room->owner)->get($url);
        $response->assertForbidden();
    }

    public function test_download_recording()
    {
        config(['recording.download_allowlist' => '(.*)']);

        Storage::fake('recordings');

        $recording = Recording::factory()->create();
        $room = $recording->room;

        // Create formats
        RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);
        RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);

        // Create folder with recording files
        Storage::disk('recordings')->makeDirectory($recording->id);
        Storage::disk('recordings')->makeDirectory($recording->id.'/notes');
        Storage::disk('recordings')->makeDirectory($recording->id.'/podcast');
        UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf')->storeAs($recording->id.'/notes', 'notes.pdf', 'recordings');
        UploadedFile::fake()->create('audio.ogg', 100, 'audio/ogg')->storeAs($recording->id.'/podcast', 'audio.ogg', 'recordings');

        // Check if owner can download the file
        $response = $this->actingAs($room->owner)->get(route('recording.download', ['recording' => $recording]));
        $response->assertSuccessful();

        $zipFile = $response->streamedContent();
        $tempFile = tempnam(sys_get_temp_dir(), 'zip_file');
        file_put_contents($tempFile, $zipFile);

        $tempDir = tempnam(sys_get_temp_dir(), 'zip_content');
        unlink($tempDir);
        mkdir($tempDir);

        $zip = new ZipArchive;
        $zip->open($tempFile);
        $zip->extractTo($tempDir);
        $zip->close();

        $zipRoot = scandir($tempDir);
        $this->assertEquals([
            '.',
            '..',
            'notes',
            'podcast',
        ], $zipRoot);

        $notesFiles = scandir($tempDir.'/notes');
        $this->assertEquals([
            '.',
            '..',
            'notes.pdf',
        ], $notesFiles);

        $podcastFiles = scandir($tempDir.'/podcast');
        $this->assertEquals([
            '.',
            '..',
            'audio.ogg',
        ], $podcastFiles);

        unlink($tempFile);
        FileHelper::deleteDirectory($tempDir);
    }

    public function test_download_recording_with_whitelist()
    {
        config(['recording.download_allowlist' => '^.*\.(pdf|mp4)$']);

        Storage::fake('recordings');

        $recording = Recording::factory()->create();
        $room = $recording->room;

        // Create formats
        RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);
        RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);

        // Create folder with recording files
        Storage::disk('recordings')->makeDirectory($recording->id);
        Storage::disk('recordings')->makeDirectory($recording->id.'/notes');
        Storage::disk('recordings')->makeDirectory($recording->id.'/podcast');
        UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf')->storeAs($recording->id.'/notes', 'notes.pdf', 'recordings');
        UploadedFile::fake()->create('audio.ogg', 100, 'audio/ogg')->storeAs($recording->id.'/podcast', 'audio.ogg', 'recordings');

        // Check if owner can download the file
        $response = $this->actingAs($room->owner)->get(route('recording.download', ['recording' => $recording]));
        $response->assertSuccessful();

        $zipFile = $response->streamedContent();
        $tempFile = tempnam(sys_get_temp_dir(), 'zip_file');
        file_put_contents($tempFile, $zipFile);

        $tempDir = tempnam(sys_get_temp_dir(), 'zip_content');
        unlink($tempDir);
        mkdir($tempDir);

        $zip = new ZipArchive;
        $zip->open($tempFile);
        $zip->extractTo($tempDir);
        $zip->close();

        $zipRoot = scandir($tempDir);
        $this->assertEquals([
            '.',
            '..',
            'notes',
        ], $zipRoot);

        $notesFiles = scandir($tempDir.'/notes');
        $this->assertEquals([
            '.',
            '..',
            'notes.pdf',
        ], $notesFiles);

        unlink($tempFile);
        FileHelper::deleteDirectory($tempDir);
    }

    public function test_download_recording_permissions()
    {
        config(['recording.download_allowlist' => '.*']);

        Storage::fake('recordings');

        $recording = Recording::factory()->create();
        $room = $recording->room;

        // Create formats
        RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);
        RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);

        // Create folder with recording files
        Storage::disk('recordings')->makeDirectory($recording->id);
        Storage::disk('recordings')->makeDirectory($recording->id.'/notes');
        UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf')->storeAs($recording->id.'/notes', 'notes.pdf', 'recordings');

        // Check if owner can download the file
        $this->actingAs($room->owner)->get(route('recording.download', ['recording' => $recording]))
            ->assertSuccessful();

        // Check if co-owner can download the file
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->get(route('recording.download', ['recording' => $recording]))
            ->assertSuccessful();

        // Check if moderator can download the file
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->get(route('recording.download', ['recording' => $recording]))
            ->assertForbidden();

        // Check if participant can download the file
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::USER]]);
        $this->actingAs($this->user)->get(route('recording.download', ['recording' => $recording]))
            ->assertForbidden();

        // Check if non-member cannot download the file
        $room->members()->detach($this->user->id);
        $this->actingAs($this->user)->get(route('recording.download', ['recording' => $recording]))
            ->assertForbidden();

        // Check if guest cannot download the file
        Auth::logout();
        $this->get(route('recording.download', ['recording' => $recording]))
            ->assertStatus(302);

        // Check if user with viewAll rooms permission can download
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->user->roles()->attach($this->role);
        $this->actingAs($this->user)->get(route('recording.download', ['recording' => $recording]))
            ->assertSuccessful();

        // Check if user with manage rooms permission can download
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->get(route('recording.download', ['recording' => $recording]))
            ->assertSuccessful();
    }
}
