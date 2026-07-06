<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Tests\Backend\Feature\api\v1;

use App\Enums\CustomErrorMessages;
use App\Enums\CustomStatusCodes;
use App\Enums\RecordingAccess;
use App\Enums\RoomAuthTokenType;
use App\Enums\RoomUserRole;
use App\Models\Permission;
use App\Models\Recording;
use App\Models\RecordingFormat;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomAuthToken;
use App\Models\RoomPersonalizedLink;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Tests\Backend\TestCase;
use Tests\Backend\Utils\FileHelper;
use Tests\Backend\Utils\SessionHelpers;
use ZipArchive;

/**
 * Recording tests
 */
class RecordingTest extends TestCase
{
    use RefreshDatabase, SessionHelpers, WithFaker;

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
        $room->access_code = $this->createAccessCode();
        $room->save();

        Recording::factory()->count(7)->create(['room_id' => $room->id, 'access' => RecordingAccess::OWNER]);
        Recording::factory()->count(6)->create(['room_id' => $room->id, 'access' => RecordingAccess::MODERATOR]);
        Recording::factory()->count(3)->create(['room_id' => $room->id, 'access' => RecordingAccess::PARTICIPANT]);
        Recording::factory()->count(2)->create(['room_id' => $room->id, 'access' => RecordingAccess::EVERYONE]);

        foreach (Recording::all() as $recording) {
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);
        }

        // Access as guest without room auth token
        $this->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertForbidden()
            ->assertJsonFragment(['message' => CustomErrorMessages::ROOM_REQUIRE_CODE->value]);

        // Access as guest invalid room auth token
        $this->getJson(route('api.v1.rooms.recordings.index', [
            'room' => $room->id,
            'room_auth_token' => 'invalidToken',
            'room_auth_token_type' => RoomAuthTokenType::CODE->value,
        ]))
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value]);

        $this->getJson(route('api.v1.rooms.recordings.index', [
            'room' => $room->id,
            'room_auth_token' => $this->faker->uuid(),
            'room_auth_token_type' => RoomAuthTokenType::CODE->value,
        ]))
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value]);

        $currentSession = $this->startNewSession();

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $room->id,
            'type' => RoomAuthTokenType::CODE,
        ]);

        // Access as guest with valid room auth token
        $this->getJson(route('api.v1.rooms.recordings.index', [
            'room' => $room->id,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::CODE->value,
        ]))
            ->assertOk()
            ->assertJsonCount(2, 'data');

        // Access with valid room auth token but invalid room_auth_token_type
        $this->getJson(route('api.v1.rooms.recordings.index', [
            'room' => $room->id,
            'room_auth_token' => $roomAuthToken->id,
        ]))
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value]);

        $this->getJson(route('api.v1.rooms.recordings.index', [
            'room' => $room->id,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
        ]))
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value]);

        $this->getJson(route('api.v1.rooms.recordings.index', [
            'room' => $room->id,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => 'invalidType',
        ]))
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value]);

        // Access as authenticated user, without room auth token
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertForbidden()
            ->assertJsonFragment(['message' => CustomErrorMessages::ROOM_REQUIRE_CODE->value]);

        // Access as authenticated user, with invalid room auth token
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', [
                'room' => $room->id,
                'room_auth_token' => 'invalidToken',
                'room_auth_token_type' => RoomAuthTokenType::CODE->value,
            ]))
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value]);

        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', [
                'room' => $room->id,
                'room_auth_token' => $this->faker->uuid(),
                'room_auth_token_type' => RoomAuthTokenType::CODE->value,
            ]))
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value]);

        // Access as authenticated user, with correct access code but only show public recordings
        $currentSession = $this->startNewSession($this->user);

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $room->id,
            'type' => RoomAuthTokenType::CODE,
        ]);

        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', [
                'room' => $room->id,
                'room_auth_token' => $roomAuthToken->id,
                'room_auth_token_type' => RoomAuthTokenType::CODE->value,
            ]))
            ->assertOk()
            ->assertJsonCount(2, 'data');

        // Access with valid room auth token but invalid room_auth_token_type
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', [
                'room' => $room->id,
                'room_auth_token' => $roomAuthToken->id,
            ]))
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value]);

        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', [
                'room' => $room->id,
                'room_auth_token' => $roomAuthToken->id,
                'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
            ]))
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value]);

        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', [
                'room' => $room->id,
                'room_auth_token' => $roomAuthToken->id,
                'room_auth_token_type' => 'invalidType',
            ]))
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value]);

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
        $room->access_code = $this->createAccessCode();
        $room->save();

        Recording::factory()->count(7)->create(['room_id' => $room->id, 'access' => RecordingAccess::OWNER]);
        Recording::factory()->count(6)->create(['room_id' => $room->id, 'access' => RecordingAccess::MODERATOR]);
        Recording::factory()->count(3)->create(['room_id' => $room->id, 'access' => RecordingAccess::PARTICIPANT]);
        Recording::factory()->count(2)->create(['room_id' => $room->id, 'access' => RecordingAccess::EVERYONE]);

        foreach (Recording::all() as $recording) {
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);
        }

        // Access as guest with valid room auth token
        $currentSession = $this->startNewSession();

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $room->id,
            'type' => RoomAuthTokenType::CODE,
        ]);

        $this->getJson(route('api.v1.rooms.recordings.index', [
            'room' => $room->id,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::CODE->value,
        ]))
            ->assertForbidden()
            ->assertJsonFragment(['message' => CustomErrorMessages::GUESTS_NOT_ALLOWED->value]);

        // Access as authenticated user, without room auth token
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]))
            ->assertForbidden()
            ->assertJsonFragment(['message' => CustomErrorMessages::ROOM_REQUIRE_CODE->value]);

        // Access as authenticated user, with correct access
        $currentSession = $this->startNewSession($this->user);

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $room->id,
            'type' => RoomAuthTokenType::CODE,
        ]);

        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', [
                'room' => $room->id,
                'room_auth_token' => $roomAuthToken->id,
                'room_auth_token_type' => RoomAuthTokenType::CODE->value,
            ]))
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_index_search()
    {
        $page_size = 5;
        $this->generalSettings->pagination_page_size = $page_size;
        $this->generalSettings->save();

        $room = Room::factory()->create();
        $room->allow_guests = false;
        $room->access_code = $this->createAccessCode();
        $room->save();

        Recording::factory()->create(['room_id' => $room->id, 'description' => 'Demo 1', 'access' => RecordingAccess::OWNER]);
        Recording::factory()->create(['room_id' => $room->id, 'description' => 'Demo 2', 'access' => RecordingAccess::MODERATOR]);
        Recording::factory()->create(['room_id' => $room->id, 'description' => 'Test 1', 'access' => RecordingAccess::PARTICIPANT]);
        Recording::factory()->create(['room_id' => $room->id, 'description' => 'Test 2', 'access' => RecordingAccess::EVERYONE]);

        foreach (Recording::all() as $recording) {
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);
        }

        // Test search
        $this->actingAs($room->owner)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]).'?query=emo')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        // Test search; empty is ignored, no filtering
        $this->actingAs($room->owner)
            ->getJson(route('api.v1.rooms.recordings.index', ['room' => $room->id]).'?query=')
            ->assertOk()
            ->assertJsonPath('meta.total', 4);
    }

    public function test_index_pagination()
    {
        $page_size = 5;
        $this->generalSettings->pagination_page_size = $page_size;
        $this->generalSettings->save();

        $room = Room::factory()->create();
        $room->allow_guests = false;
        $room->access_code = $this->createAccessCode();
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

    public function test_index_room_personalized_link()
    {
        $page_size = 20;
        $this->generalSettings->pagination_page_size = $page_size;
        $this->generalSettings->save();

        $room = Room::factory()->create();
        $room->allow_guests = false;
        $room->access_code = $this->createAccessCode();
        $room->save();

        Recording::factory()->count(7)->create(['room_id' => $room->id, 'access' => RecordingAccess::OWNER]);
        Recording::factory()->count(6)->create(['room_id' => $room->id, 'access' => RecordingAccess::MODERATOR]);
        Recording::factory()->count(3)->create(['room_id' => $room->id, 'access' => RecordingAccess::PARTICIPANT]);
        Recording::factory()->count(2)->create(['room_id' => $room->id, 'access' => RecordingAccess::EVERYONE]);

        foreach (Recording::all() as $recording) {
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);
            RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'podcast']);
        }

        // Create personalized room link
        $link = RoomPersonalizedLink::factory()->create(['room_id' => $room->id]);
        $link->role = RoomUserRole::USER;
        $link->save();

        $currentSession = $this->startNewSession();

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $room->id,
            'type' => RoomAuthTokenType::PERSONALIZED_LINK,
            'room_personalized_link_id' => $link->id,
        ]);

        // Access as guest with personalized link with room participant role
        $this->getJson(route('api.v1.rooms.recordings.index', [
            'room' => $room->id,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
        ]))
            ->assertSuccessful()
            ->assertJsonCount(5, 'data');

        // Increase personalized link role to moderator
        $link->role = RoomUserRole::MODERATOR;
        $link->save();

        // Access as guest with personalized link with room moderator role
        $this->getJson(route('api.v1.rooms.recordings.index', [
            'room' => $room->id,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
        ]))
            ->assertSuccessful()
            ->assertJsonCount(11, 'data');

        // Access as user with personalized link
        $this->actingAs($this->user)
            ->getJson(route('api.v1.rooms.recordings.index', [
                'room' => $room->id,
                'room_auth_token' => $roomAuthToken->id,
                'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
            ]))
            ->assertStatus(CustomStatusCodes::GUESTS_ONLY->value);
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
        $this->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertRedirectToRoute('recording.resource', [
                'formatName' => $format->format,
                'recording' => $recording->id,
                'resource' => 'audio.ogg',
            ]);
    }

    public function test_show_access_code_guests_allowed()
    {
        $format = RecordingFormat::factory()->create(['format' => 'podcast']);
        $recording = $format->recording;
        $room = $recording->room;

        $recording->access = RecordingAccess::EVERYONE;
        $recording->save();

        $room->allow_guests = true;
        $room->access_code = $this->createAccessCode();
        $room->save();

        // Access as guest without room auth token
        $this->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_REQUIRE_CODE->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.require_access_code'),
            ]);

        // Access as guest with invalid room auth token
        $this->get(route('rooms.recordings.formats.show', [
            'room' => $recording->room->id,
            'recording' => $recording->id,
            'format' => $format->id,
            'room_auth_token' => 'invalidToken',
            'room_auth_token_type' => RoomAuthTokenType::CODE->value,
        ]))
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);

        $this->get(route('rooms.recordings.formats.show', [
            'room' => $recording->room->id,
            'recording' => $recording->id,
            'format' => $format->id,
            'room_auth_token' => $this->faker->uuid(),
            'room_auth_token_type' => RoomAuthTokenType::CODE->value,
        ]))
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.access_code_invalid'),
            ]);

        // Access as guest with correct room auth token
        $currentSession = $this->startNewSession();

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $room->id,
            'type' => RoomAuthTokenType::CODE,
        ]);

        $this->withCookies([
            session()->getName() => $currentSession->id,
        ])->get(route('rooms.recordings.formats.show', [
            'room' => $recording->room->id,
            'recording' => $recording->id,
            'format' => $format->id,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::CODE->value,
        ]))
            ->assertRedirectToRoute('recording.resource', [
                'formatName' => $format->format,
                'recording' => $recording->id,
                'resource' => 'audio.ogg',
            ]);

        // Access with valid room auth token but invalid room_auth_token_type
        $this->withCookies([
            session()->getName() => $currentSession->id,
        ])->get(route('rooms.recordings.formats.show', [
            'room' => $recording->room->id,
            'recording' => $recording->id,
            'format' => $format->id,
            'room_auth_token' => $roomAuthToken->id,
        ]))
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);

        $this->withCookies([
            session()->getName() => $currentSession->id,
        ])->get(route('rooms.recordings.formats.show', [
            'room' => $recording->room->id,
            'recording' => $recording->id,
            'format' => $format->id,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
        ]))
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);

        $this->withCookies([
            session()->getName() => $currentSession->id,
        ])->get(route('rooms.recordings.formats.show', [
            'room' => $recording->room->id,
            'recording' => $recording->id,
            'format' => $format->id,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => 'invalidType',
        ]))
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);
    }

    public function test_show_access_code_guests_not_allowed()
    {
        $format = RecordingFormat::factory()->create(['format' => 'podcast']);
        $recording = $format->recording;
        $room = $recording->room;

        $recording->access = RecordingAccess::EVERYONE;
        $recording->save();

        $room->allow_guests = false;
        $room->access_code = $this->createAccessCode();
        $room->save();

        $currentSession = $this->startNewSession();

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $room->id,
            'type' => RoomAuthTokenType::CODE,
        ]);

        // Access as guest with valid room auth token
        $this->withCookies([
            session()->getName() => $currentSession->id,
        ])->
        get(route('rooms.recordings.formats.show', [
            'room' => $recording->room->id,
            'recording' => $recording->id,
            'format' => $format->id,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::CODE->value,
        ]))
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::GUESTS_NOT_ALLOWED->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.only_used_by_authenticated_users'),
            ]);
    }

    public function test_show_personalized_link()
    {
        $format = RecordingFormat::factory()->create(['format' => 'podcast']);
        $recording = $format->recording;
        $room = $recording->room;

        $recording->access = RecordingAccess::EVERYONE;
        $recording->save();

        $room->allow_guests = false;
        $room->access_code = $this->createAccessCode();
        $room->save();

        // Create a personalized link
        $link = RoomPersonalizedLink::factory()->create(['room_id' => $room->id]);
        $link->role = RoomUserRole::USER;
        $link->save();

        $currentSession = $this->startNewSession();
        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $room->id,
            'type' => RoomAuthTokenType::PERSONALIZED_LINK,
            'room_personalized_link_id' => $link->id,
        ]);

        // Access as guest with personalized link with room participant role
        $this->withCookies([
            session()->getName() => $currentSession->id,
        ])->get(route('rooms.recordings.formats.show', [
            'room' => $recording->room->id,
            'recording' => $recording->id,
            'format' => $format->id,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
        ]))
            ->assertRedirectToRoute('recording.resource', [
                'formatName' => $format->format,
                'recording' => $recording->id,
                'resource' => 'audio.ogg',
            ]);

        // Increase recording access to participant
        $recording->access = RecordingAccess::PARTICIPANT;
        $recording->save();

        // Access as guest with personalized link with room participant role
        $this->withCookies([
            session()->getName() => $currentSession->id,
        ])->get(route('rooms.recordings.formats.show', [
            'room' => $recording->room->id,
            'recording' => $recording->id,
            'format' => $format->id,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
        ]))
            ->assertRedirectToRoute('recording.resource', [
                'formatName' => $format->format,
                'recording' => $recording->id,
                'resource' => 'audio.ogg',
            ]);

        // Access as user with room auth token
        $this->actingAs($this->user)
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get(route('rooms.recordings.formats.show', [
                'room' => $recording->room->id,
                'recording' => $recording->id,
                'format' => $format->id,
                'room_auth_token' => $roomAuthToken->id,
                'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
            ]))
            ->assertStatus(CustomStatusCodes::GUESTS_ONLY->value)
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::GUESTS_ONLY->value,
                'code' => CustomStatusCodes::GUESTS_ONLY->value,
                'title' => 'Guests only',
                'message' => __('app.flash.guests_only'),
            ]);

        Auth::logout();

        // Increase recording access to moderator
        $recording->access = RecordingAccess::MODERATOR;
        $recording->save();

        // Access as guest with personalized link with room participant role
        $this->withCookies([
            session()->getName() => $currentSession->id,
        ])->get(route('rooms.recordings.formats.show', [
            'room' => $recording->room->id,
            'recording' => $recording->id,
            'format' => $format->id,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
        ]))
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::FORBIDDEN->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.flash.recording_forbidden'),
            ]);

        // Increase personalized link role to moderator
        $link->role = RoomUserRole::MODERATOR;
        $link->save();

        // Access as guest with personalized link with room moderator role
        $this->withCookies([
            session()->getName() => $currentSession->id,
        ])->get(route('rooms.recordings.formats.show', [
            'room' => $recording->room->id,
            'recording' => $recording->id,
            'format' => $format->id,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
        ]))
            ->assertRedirectToRoute('recording.resource', [
                'formatName' => $format->format,
                'recording' => $recording->id,
                'resource' => 'audio.ogg',
            ]);

        // Increase recording access to owner
        $recording->access = RecordingAccess::OWNER;
        $recording->save();

        // Access as guest with personalized link with room moderator role
        $this->withCookies([
            session()->getName() => $currentSession->id,
        ])->get(route('rooms.recordings.formats.show', [
            'room' => $recording->room->id,
            'recording' => $recording->id,
            'format' => $format->id,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::PERSONALIZED_LINK->value,
        ]))
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::FORBIDDEN->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.flash.recording_forbidden'),
            ]);
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
            ->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertRedirectToRoute('recording.resource', [
                'formatName' => $format->format,
                'recording' => $recording->id,
                'resource' => 'audio.ogg',
            ]);

        // Disable format
        $format->disabled = true;
        $format->save();

        // Try to access disabled format
        $this->actingAs($this->user)
            ->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::FORBIDDEN->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.flash.recording_forbidden'),
            ]);

        // Test owner can access disabled format
        $this->actingAs($room->owner)
            ->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertRedirectToRoute('recording.resource', [
                'formatName' => $format->format,
                'recording' => $recording->id,
                'resource' => 'audio.ogg',
            ]);
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
        $this->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertRedirectToRoute('recording.resource', [
                'formatName' => $format->format,
                'recording' => $recording->id,
                'resource' => 'audio.ogg',
            ]);

        // Every user can access
        $this->actingAs($otherUser)
            ->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertRedirectToRoute('recording.resource', [
                'formatName' => $format->format,
                'recording' => $recording->id,
                'resource' => 'audio.ogg',
            ]);
        Auth::logout();

        // Change access
        $recording->access = RecordingAccess::PARTICIPANT;
        $recording->save();

        // Try to access again as guests
        $this->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::FORBIDDEN->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.flash.recording_forbidden'),
            ]);

        //  Try to access again as normal user
        $this->actingAs($otherUser)
            ->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::FORBIDDEN->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.flash.recording_forbidden'),
            ]);
        Auth::logout();

        // Try as room member
        $room->members()->attach($this->user->id, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)
            ->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertRedirectToRoute('recording.resource', [
                'formatName' => $format->format,
                'recording' => $recording->id,
                'resource' => 'audio.ogg',
            ]);

        // Change access
        $recording->access = RecordingAccess::MODERATOR;
        $recording->save();

        // Try to access again
        $this->actingAs($this->user)
            ->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::FORBIDDEN->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.flash.recording_forbidden'),
            ]);

        // Test user with higher role can access
        $room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)
            ->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertRedirectToRoute('recording.resource', [
                'formatName' => $format->format,
                'recording' => $recording->id,
                'resource' => 'audio.ogg',
            ]);

        // Change access
        $recording->access = RecordingAccess::OWNER;
        $recording->save();

        // Try to access again
        $this->actingAs($this->user)
            ->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::FORBIDDEN->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.flash.recording_forbidden'),
            ]);

        // Test owner can access
        $this->actingAs($room->owner)
            ->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertRedirectToRoute('recording.resource', [
                'formatName' => $format->format,
                'recording' => $recording->id,
                'resource' => 'audio.ogg',
            ]);
    }

    public function test_show_wrong_format()
    {
        $format = RecordingFormat::factory()->create(['format' => 'podcast']);
        $recording = $format->recording;

        $otherRoom = Room::factory()->create();

        $this->actingAs($otherRoom->owner)
            ->get(route('rooms.recordings.formats.show', ['room' => $otherRoom->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertNotFound()
            ->assertSee('type: "not_found"', false);
    }

    public function test_show_url()
    {
        Storage::fake('recordings');

        $format = RecordingFormat::factory()->create(['format' => 'podcast']);
        $recording = $format->recording;
        $room = $recording->room;

        // Check redirect to the resource route (for all formats except presentation)
        $this->actingAs($room->owner)
            ->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertRedirectToRoute('recording.resource', ['formatName' => $format->format, 'recording' => $recording->id, 'resource' => 'audio.ogg']);

        // Check redirect to the player route (for presentation format)
        $format = RecordingFormat::factory()->create(['format' => 'presentation']);
        $recording = $format->recording;
        $room = $recording->room;

        UploadedFile::fake()->create('metadata.xml', 100, 'application/xml')->storeAs($recording->id.'/presentation', 'metadata.xml', 'recordings');

        config(['recording.player' => 'https://example.com/player']);

        $this->actingAs($room->owner)
            ->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $format->id]))
            ->assertRedirect('https://example.com/player/'.$recording->id.'/');

        // Access presentation files (requested by the player)
        $this->actingAs($room->owner)
            ->get(route('recording.presentation', ['recording' => $recording->id, 'resource' => 'metadata.xml']))
            ->assertHeader('x-accel-redirect', '/private-storage/recordings/'.$recording->id.'/presentation/metadata.xml');
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

        // Test deleted recording
        $recording->delete();

        $this->putJson(route('api.v1.rooms.recordings.update', ['room' => $room->id, 'recording' => $recording->id]), $payload)
            ->assertNotFound()
            ->assertJson([
                'message' => 'model_not_found',
                'model' => 'recording',
                'ids' => [$recording->id],
            ]);

        // Test deleted room
        $room->delete();

        $this->putJson(route('api.v1.rooms.recordings.update', ['room' => $room->id, 'recording' => $recording->id]), $payload)
            ->assertNotFound()
            ->assertJson([
                'message' => 'model_not_found',
                'model' => 'room',
                'ids' => [$room->id],
            ]);
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
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['description', 'access', 'formats.0.disabled', 'formats.1.disabled', 'formats.2.id', 'formats.3.id']);

        // Check updating recording with wrong room in url
        $otherRoom = Room::factory()->create();
        $this->actingAs($otherRoom->owner)
            ->putJson(route('api.v1.rooms.recordings.update', ['room' => $otherRoom->id, 'recording' => $recording->id]), $payload)
            ->assertNotFound()
            ->assertJson([
                'message' => 'model_not_found',
                'model' => 'recording',
                'ids' => [$recording->id],
            ]);

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

        // Test delete again
        $this->actingAs($room->owner)
            ->deleteJson(route('api.v1.rooms.recordings.destroy', ['room' => $room->id, 'recording' => $recording->id]))
            ->assertNotFound()
            ->assertJson([
                'message' => 'model_not_found',
                'model' => 'recording',
                'ids' => [$recording->id],
            ]);
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
            ->assertNotFound()
            ->assertJson([
                'message' => 'model_not_found',
                'model' => 'recording',
                'ids' => [$recording->id],
            ]);
    }

    public function test_access_recording_resource()
    {
        Storage::fake('recordings');

        $recording = Recording::factory()->create();
        $room = $recording->room;

        // Create format
        $notes = RecordingFormat::factory()->create(['recording_id' => $recording->id, 'format' => 'notes']);

        // Create recording files
        UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf')->storeAs($recording->id.'/notes', 'notes.pdf', 'recordings');
        UploadedFile::fake()->create('audio.ogg', 100, 'audio/ogg')->storeAs($recording->id.'/podcast', 'audio.ogg', 'recordings');

        // Check url is redirecting to the resource route
        $url = route('recording.resource', [
            'formatName' => $notes->format,
            'recording' => $recording->id,
            'resource' => 'notes.pdf',
        ]);

        $this->actingAs($room->owner)
            ->get(route('rooms.recordings.formats.show', ['room' => $recording->room->id, 'recording' => $recording->id, 'format' => $notes->id]))
            ->assertRedirect($url);

        // Access the resource
        $response = $this->actingAs($room->owner)->get($url);
        $response->assertSuccessful();

        // Check if file headers for reverse proxy are correctly set
        $this->assertEquals('/private-storage/recordings/'.$recording->id.'/notes/notes.pdf', $response->headers->get('x-accel-redirect'));

        // Try to path traversal
        $response = $this->actingAs($room->owner)->get(route('recording.resource', ['formatName' => 'notes', 'recording' => $recording->id, 'resource' => '../podcast/audio.ogg']));
        $response->assertNotFound()->assertViewIs('new-tab-error')->assertViewHasAll([
            'type' => CustomErrorMessages::FILE_NOT_FOUND->value,
            'code' => 404,
            'title' => 'File not found',
            'message' => __('rooms.flash.recording_gone'),
        ]);

        // Try invalid file
        $response = $this->actingAs($room->owner)->get(route('recording.resource', ['formatName' => 'notes', 'recording' => $recording->id, 'resource' => 'audio.ogg']));
        $response->assertNotFound()->assertViewIs('new-tab-error')->assertViewHasAll([
            'type' => CustomErrorMessages::FILE_NOT_FOUND->value,
            'code' => 404,
            'title' => 'File not found',
            'message' => __('rooms.flash.recording_gone'),
        ]);

        // Try to access other format
        $this->actingAs($room->owner)->get(route('recording.resource', ['formatName' => 'podcast', 'recording' => $recording->id, 'resource' => 'audio.ogg']))
            ->assertNotFound()
            ->assertSee('type: "not_found"', false);

        // Check if permission to access the resource are bound to the session
        $this->flushSession();
        $response = $this->actingAs($room->owner)->get($url);
        $response->assertForbidden()->assertViewIs('new-tab-error')->assertViewHasAll([
            'type' => CustomErrorMessages::FORBIDDEN->value,
            'code' => 403,
            'title' => 'Forbidden',
            'message' => __('rooms.flash.recording_forbidden'),
        ]);
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
