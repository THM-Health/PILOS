<?php

namespace Tests\Feature\api\v1;

use App\Enums\RecordingAccess;
use App\Enums\RoomUserRole;
use App\Models\Permission;
use App\Models\Recording;
use App\Models\RecordingFormat;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Storage;
use Tests\TestCase;

/**
 * Recording API tests
 *
 * @todo Add tests for room token access
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

    public function testIndexNoAccessCodeGuestsAllowed()
    {
        $page_size = 20;
        setting([
            'pagination_page_size' => $page_size,
        ]);

        $room = Room::factory()->create();
        $room->allow_guests = true;
        $room->access_code = null;
        $room->save();

        Recording::factory()->count(7)->create(['room_id' => $room->id, 'access' => RecordingAccess::OWNER]);
        Recording::factory()->count(6)->create(['room_id' => $room->id, 'access' => RecordingAccess::MODERATOR]);
        Recording::factory()->count(3)->create(['room_id' => $room->id, 'access' => RecordingAccess::PARTICIPANT]);
        Recording::factory()->count(2)->create(['room_id' => $room->id, 'access' => RecordingAccess::EVERYONE]);

        foreach (Recording::all() as $recording) {
            RecordingFormat::factory()->count(2)->create(['recording_id' => $recording->id]);
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

    public function testIndexWithAccessCodeGuestsAllowed()
    {
        $page_size = 20;
        setting([
            'pagination_page_size' => $page_size,
        ]);

        $room = Room::factory()->create();
        $room->allow_guests = true;
        $room->access_code = $this->faker->numberBetween(111111111, 999999999);
        $room->save();

        Recording::factory()->count(7)->create(['room_id' => $room->id, 'access' => RecordingAccess::OWNER]);
        Recording::factory()->count(6)->create(['room_id' => $room->id, 'access' => RecordingAccess::MODERATOR]);
        Recording::factory()->count(3)->create(['room_id' => $room->id, 'access' => RecordingAccess::PARTICIPANT]);
        Recording::factory()->count(2)->create(['room_id' => $room->id, 'access' => RecordingAccess::EVERYONE]);

        foreach (Recording::all() as $recording) {
            RecordingFormat::factory()->count(2)->create(['recording_id' => $recording->id]);
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

    public function testIndexWithAccessCodeGuestsNotAllowed()
    {
        $page_size = 20;
        setting([
            'pagination_page_size' => $page_size,
        ]);

        $room = Room::factory()->create();
        $room->allow_guests = false;
        $room->access_code = $this->faker->numberBetween(111111111, 999999999);
        $room->save();

        Recording::factory()->count(7)->create(['room_id' => $room->id, 'access' => RecordingAccess::OWNER]);
        Recording::factory()->count(6)->create(['room_id' => $room->id, 'access' => RecordingAccess::MODERATOR]);
        Recording::factory()->count(3)->create(['room_id' => $room->id, 'access' => RecordingAccess::PARTICIPANT]);
        Recording::factory()->count(2)->create(['room_id' => $room->id, 'access' => RecordingAccess::EVERYONE]);

        foreach (Recording::all() as $recording) {
            RecordingFormat::factory()->count(2)->create(['recording_id' => $recording->id]);
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

    public function testIndexPagination()
    {
        $page_size = 5;
        setting([
            'pagination_page_size' => $page_size,
        ]);

        $room = Room::factory()->create();
        $room->allow_guests = false;
        $room->access_code = $this->faker->numberBetween(111111111, 999999999);
        $room->save();

        Recording::factory()->count(7)->create(['room_id' => $room->id, 'access' => RecordingAccess::OWNER]);
        Recording::factory()->count(6)->create(['room_id' => $room->id, 'access' => RecordingAccess::MODERATOR]);
        Recording::factory()->count(3)->create(['room_id' => $room->id, 'access' => RecordingAccess::PARTICIPANT]);
        Recording::factory()->count(2)->create(['room_id' => $room->id, 'access' => RecordingAccess::EVERYONE]);

        foreach (Recording::all() as $recording) {
            RecordingFormat::factory()->count(2)->create(['recording_id' => $recording->id]);
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

    public function testIndexOnlyListWithFormat()
    {
        $page_size = 5;
        setting([
            'pagination_page_size' => $page_size,
        ]);

        $room = Room::factory()->create();
        $room->save();

        $recordings = Recording::factory()->count(3)->create(['room_id' => $room->id, 'access' => RecordingAccess::PARTICIPANT]);

        // Add formats to first recording
        RecordingFormat::factory()->count(2)->create(['recording_id' => $recordings[0]->id]);
        // Add formats to second recording but disable them
        RecordingFormat::factory()->count(2)->create(['recording_id' => $recordings[1]->id, 'disabled' => true]);

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

    public function testShowNoAccessCodeGuestsAllowed()
    {
        $format = RecordingFormat::factory()->format('podcast')->create();
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

    public function testShowAccessCodeGuestsAllowed()
    {
        $format = RecordingFormat::factory()->format('podcast')->create();
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

    public function testShowAccessCodeGuestsNotAllowed()
    {
        $format = RecordingFormat::factory()->format('podcast')->create();
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

    public function testShowDisabledFormat()
    {
        $format = RecordingFormat::factory()->format('podcast')->create();
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

    public function testShowAccess()
    {
        $format = RecordingFormat::factory()->format('podcast')->create();
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

    public function testShowWrongFormat()
    {
        $format = RecordingFormat::factory()->format('podcast')->create();
        $recording = $format->recording;

        $otherRoom = Room::factory()->create();

        $this->actingAs($otherRoom->owner)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $otherRoom->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertNotFound();
    }

    public function testShowUrl()
    {
        $format = RecordingFormat::factory()->format('podcast')->create();
        $recording = $format->recording;
        $room = $recording->room;

        // Check url is pointing to the resource route (for all formats except presentation)
        $this->actingAs($room->owner)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertOk()
            ->assertJson(['url' => route('recording.resource', ['format' => $format->format, 'recording' => $recording->id, 'resource' => 'audio.ogg'])]);

        // Check url is pointing to the player route (for presentation format)
        $format = RecordingFormat::factory()->format('presentation')->create();
        $recording = $format->recording;
        $room = $recording->room;

        config(['recording.player' => 'https://example.com/player']);

        $this->actingAs($room->owner)
            ->getJson(route('api.v1.rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertOk()
            ->assertJson(['url' => 'https://example.com/player/'.$recording->id.'/']);
    }

    public function testUpdate()
    {
        $recording = Recording::factory()->create();
        $room = $recording->room;

        $podcast = RecordingFormat::factory()->format('podcast')->create(['recording_id' => $recording->id]);
        $presentation = RecordingFormat::factory()->format('presentation')->create(['recording_id' => $recording->id]);
        $notes = RecordingFormat::factory()->format('notes')->create(['recording_id' => $recording->id]);

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

    public function testUpdatePermissions()
    {
        $recording = Recording::factory()->create();
        $room = $recording->room;

        $podcast = RecordingFormat::factory()->format('podcast')->create(['recording_id' => $recording->id]);
        $presentation = RecordingFormat::factory()->format('presentation')->create(['recording_id' => $recording->id]);
        $notes = RecordingFormat::factory()->format('notes')->create(['recording_id' => $recording->id]);

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

    public function testUpdateInvalidData()
    {
        $recording = Recording::factory()->create();
        $room = $recording->room;

        $podcast = RecordingFormat::factory()->format('podcast')->create(['recording_id' => $recording->id]);
        $presentation = RecordingFormat::factory()->format('presentation')->create(['recording_id' => $recording->id]);
        RecordingFormat::factory()->format('notes')->create(['recording_id' => $recording->id]);

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

    public function testDelete()
    {
        Storage::fake('recordings');

        $recording = Recording::factory()->create();
        $room = $recording->room;

        // Create formats
        $notes = RecordingFormat::factory()->format('notes')->create(['recording_id' => $recording->id]);
        $podcast = RecordingFormat::factory()->format('podcast')->create(['recording_id' => $recording->id]);

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

    public function testDeleteOnRoomDelete()
    {
        Storage::fake('recordings');

        $recording = Recording::factory()->create();
        $room = $recording->room;

        // Create formats
        $notes = RecordingFormat::factory()->format('notes')->create(['recording_id' => $recording->id]);
        $podcast = RecordingFormat::factory()->format('podcast')->create(['recording_id' => $recording->id]);

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

    public function testDeletePermissions()
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

    public function testDeleteInvalidData()
    {
        $recording = Recording::factory()->create();

        // Check deleting recording with wrong room in url
        $otherRoom = Room::factory()->create();
        $this->actingAs($otherRoom->owner)
            ->deleteJson(route('api.v1.rooms.recordings.destroy', ['room' => $otherRoom->id, 'recording' => $recording->id]))
            ->assertNotFound();
    }
}
