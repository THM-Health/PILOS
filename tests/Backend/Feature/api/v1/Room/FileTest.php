<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Tests\Backend\Feature\api\v1\Room;

use App\Enums\CustomErrorMessages;
use App\Enums\CustomStatusCodes;
use App\Enums\RoomAuthTokenType;
use App\Enums\RoomUserRole;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomAuthToken;
use App\Models\RoomFile;
use App\Models\RoomPersonalizedLink;
use App\Models\Server;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Tests\Backend\TestCase;
use Tests\Backend\Utils\BigBlueButtonServerFaker;
use Tests\Backend\Utils\SessionHelpers;

class FileTest extends TestCase
{
    use RefreshDatabase, SessionHelpers, WithFaker;

    protected $user;

    protected $room;

    protected $role;

    protected $managePermission;

    protected $viewAllPermission;

    protected $file_valid;

    protected $file_wrongmime;

    protected $file_toobig;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->user = User::factory()->create();
        $this->role = Role::factory()->create();
        $this->managePermission = Permission::factory()->create(['name' => 'rooms.manage']);
        $this->viewAllPermission = Permission::factory()->create(['name' => 'rooms.viewAll']);
        $this->room = Room::factory()->create();
        $this->file_valid = UploadedFile::fake()->create('document.pdf', config('bigbluebutton.max_filesize') * 1000 - 1, 'application/pdf');
        $this->file_wrongmime = UploadedFile::fake()->create('documents.zip', config('bigbluebutton.max_filesize') * 1000 - 1, 'application/zip');
        $this->file_toobig = UploadedFile::fake()->create('document.pdf', config('bigbluebutton.max_filesize') * 1000 + 1, 'application/pdf');
    }

    /**
     * Test to upload a valid file as different users
     */
    public function test_upload_valid_file()
    {
        // Testing guests
        $this->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertUnauthorized();

        // Testing user
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertForbidden();

        // Testing member
        $this->room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertForbidden();

        // Testing moderator member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertForbidden();

        // Testing co-owner member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();

        // Testing owner
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();

        // Remove membership roles
        $this->room->members()->sync([]);

        // Test view all permission
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // Test manage permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();
        $this->role->permissions()->detach($this->managePermission);

        Storage::disk('local')->assertExists($this->room->id.'/'.$this->file_valid->hashName());
    }

    /**
     * Test to upload different invalid files
     */
    public function test_upload_invalid_file()
    {
        // No file
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]))
            ->assertJsonValidationErrors('file');

        // File invalid file type
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_wrongmime])
            ->assertJsonValidationErrors('file');
        Storage::disk('local')->assertMissing($this->room->id.'/'.$this->file_wrongmime->hashName());

        // File too large
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_toobig])
            ->assertJsonValidationErrors('file');
        Storage::disk('local')->assertMissing($this->room->id.'/'.$this->file_toobig->hashName());

        // Virus file
        config([
            'antivirus.enabled' => true,
            'antivirus.clamav.url' => 'http://clamav',
        ]);
        Http::fake(['http://clamav' => Http::response([['Description' => 'Eicar-Test-Signature']], 406)]);
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => UploadedFile::fake()->create('virus.txt')])
            ->assertJsonValidationErrors('file');
        config([
            'antivirus.enabled' => false,
        ]);
    }

    /**
     * Testing access to internal and public file list as different users and permissions
     */
    public function test_view_files()
    {
        $document = RoomFile::factory()->create(['filename' => 'document.pdf', 'created_at' => '2024-04-01 08:00:00', 'download' => true, 'default' => true, 'use_in_meeting' => true, 'room_id' => $this->room->id]);
        $presentation = RoomFile::factory()->create(['filename' => 'presentation.pptx', 'created_at' => '2024-04-01 09:00:00', 'download' => false, 'default' => false, 'use_in_meeting' => true, 'room_id' => $this->room->id]);
        $notes = RoomFile::factory()->create(['filename' => 'notes.pdf', 'created_at' => '2024-04-01 10:00:00', 'download' => true, 'default' => false, 'use_in_meeting' => false, 'room_id' => $this->room->id]);

        Auth::logout();
        // Testing access for room owners only file list

        // Testing guests without guest access
        $this->getJson(route('api.v1.rooms.files.get', ['room' => $this->room]))
            ->assertForbidden()
            ->assertJsonFragment(['message' => CustomErrorMessages::GUESTS_NOT_ALLOWED->value]);

        $this->room->allow_guests = true;
        $this->room->save();

        // Testing guests with guest access
        $this->getJson(route('api.v1.rooms.files.get', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $document, 'filename' => $document->filename]))
            ->assertJsonPath('data.1.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $notes, 'filename' => $notes->filename]));

        // Testing users
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.files.get', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $document, 'filename' => $document->filename]))
            ->assertJsonPath('data.1.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $notes, 'filename' => $notes->filename]));
        Auth::logout();

        $this->room->access_code = $this->createAccessCode();
        $this->room->save();

        // Testing guests without room auth token
        $this->getJson(route('api.v1.rooms.files.get', ['room' => $this->room]))
            ->assertForbidden()
            ->assertJsonFragment(['message' => CustomErrorMessages::ROOM_REQUIRE_CODE->value]);

        // Testing users without room auth token
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.files.get', ['room' => $this->room]))
            ->assertForbidden()
            ->assertJsonFragment(['message' => CustomErrorMessages::ROOM_REQUIRE_CODE->value]);
        Auth::logout();

        // Create RoomAuthToken with token type code
        $currentSession = $this->startNewSession();

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $this->room->id,
            'type' => RoomAuthTokenType::CODE,
        ]);

        // Testing guests with room auth token (access code)
        $this
            ->getJson(route('api.v1.rooms.files.get', [
                'room' => $this->room,
                'room_auth_token' => $roomAuthToken->id,
                'room_auth_token_type' => RoomAuthTokenType::CODE->value,
            ]))
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $document, 'filename' => $document->filename]))
            ->assertJsonPath('data.1.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $notes, 'filename' => $notes->filename]));

        // Testing users with room auth token (access code)
        $currentSession = $this->startNewSession($this->user);

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $this->room->id,
            'type' => RoomAuthTokenType::CODE,
        ]);

        $this->actingAs($this->user)->getJson(route('api.v1.rooms.files.get', [
            'room' => $this->room,
            'room_auth_token' => $roomAuthToken->id,
            'room_auth_token_type' => RoomAuthTokenType::CODE->value,
        ]))
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $document, 'filename' => $document->filename]))
            ->assertJsonPath('data.1.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $notes, 'filename' => $notes->filename]));

        // Testing member
        $this->room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.files.get', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $document, 'filename' => $document->filename]))
            ->assertJsonPath('data.1.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $notes, 'filename' => $notes->filename]));

        // Testing moderator member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.files.get', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $document, 'filename' => $document->filename]))
            ->assertJsonPath('data.1.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $notes, 'filename' => $notes->filename]));

        // Testing co-owner member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.files.get', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $document, 'filename' => $document->filename]))
            ->assertJsonPath('data.1.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $notes, 'filename' => $notes->filename]))
            ->assertJsonPath('data.2.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $presentation, 'filename' => $presentation->filename]));

        // Testing owner
        $this->actingAs($this->room->owner)->getJson(route('api.v1.rooms.files.get', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $document, 'filename' => $document->filename]))
            ->assertJsonPath('data.1.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $notes, 'filename' => $notes->filename]))
            ->assertJsonPath('data.2.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $presentation, 'filename' => $presentation->filename]));

        // Remove membership roles and test with view all permission
        $this->room->members()->sync([]);
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->getJson(route('api.v1.rooms.files.get', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $document, 'filename' => $document->filename]))
            ->assertJsonPath('data.1.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $notes, 'filename' => $notes->filename]))
            ->assertJsonPath('data.2.url', URL::signedRoute('rooms.files.download', ['room' => $this->room, 'file' => $presentation, 'filename' => $presentation->filename]));

        $this->role->permissions()->detach($this->viewAllPermission);

        // Test default sorting / fallback
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.files.get', ['room' => $this->room]))
            ->assertSuccessful()
            ->assertJsonPath('data.0.filename', 'document.pdf')
            ->assertJsonPath('data.1.filename', 'notes.pdf')
            ->assertJsonPath('data.2.filename', 'presentation.pptx');

        // Test sorting by name desc
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.files.get', ['room' => $this->room, 'sort_direction' => 'desc']))
            ->assertSuccessful()
            ->assertJsonPath('data.0.filename', 'presentation.pptx')
            ->assertJsonPath('data.1.filename', 'notes.pdf')
            ->assertJsonPath('data.2.filename', 'document.pdf');

        // Test sorting by date
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.files.get', ['room' => $this->room, 'sort_by' => 'uploaded', 'sort_direction' => 'asc']))
            ->assertSuccessful()
            ->assertJsonPath('data.0.filename', 'document.pdf')
            ->assertJsonPath('data.1.filename', 'presentation.pptx')
            ->assertJsonPath('data.2.filename', 'notes.pdf');

        // Test sorting by date desc
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.files.get', ['room' => $this->room, 'sort_by' => 'uploaded', 'sort_direction' => 'desc']))
            ->assertSuccessful()
            ->assertJsonPath('data.0.filename', 'notes.pdf')
            ->assertJsonPath('data.1.filename', 'presentation.pptx')
            ->assertJsonPath('data.2.filename', 'document.pdf');

        // Test search
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.files.get', ['room' => $this->room, 'query' => '.pdf']))
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.filename', 'document.pdf')
            ->assertJsonPath('data.1.filename', 'notes.pdf');

        // Test search; empty is ignored, no filtering
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.files.get', ['room' => $this->room, 'query' => '']))
            ->assertSuccessful()
            ->assertJsonPath('meta.total', 3);

        // Test filter downloadable
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.files.get', ['room' => $this->room, 'filter' => 'downloadable']))
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.filename', 'document.pdf')
            ->assertJsonPath('data.1.filename', 'notes.pdf');

        // Test filter use in meeting
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.files.get', ['room' => $this->room, 'filter' => 'use_in_meeting']))
            ->assertSuccessful()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.filename', 'document.pdf')
            ->assertJsonPath('data.1.filename', 'presentation.pptx');

        // Test filter and search
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.files.get', ['room' => $this->room, 'filter' => 'use_in_meeting', 'query' => '.pdf']))
            ->assertSuccessful()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.filename', 'document.pdf')
            ->assertJsonPath('meta.total_no_filter', 3);

        // Test search with no results
        $this->actingAs($this->room->owner)
            ->getJson(route('api.v1.rooms.files.get', ['room' => $this->room, 'query' => 'test']))
            ->assertSuccessful()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.total', 0)
            ->assertJsonPath('meta.total_no_filter', 3);
    }

    /**
     * Test file download of file that is shared with participants of a room without an access code
     */
    public function test_download_files_download()
    {
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();

        // Set file to downloadable
        $room_file = $this->room->files()->where('filename', $this->file_valid->name)->first();
        $room_file->download = true;
        $room_file->save();

        // Retrieve download link
        $download_link = $this->getJson(route('api.v1.rooms.files.get', ['room' => $this->room]))
            ->assertSuccessful()->json('data.0.url');

        Auth::logout();

        // Access as guest, without guest access
        $this->get($download_link)
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::GUESTS_NOT_ALLOWED->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.only_used_by_authenticated_users'),
            ]);

        // Testing user (room has no access code => download allowed)
        $this->actingAs($this->user)->get($download_link)
            ->assertSuccessful();

        Auth::logout();

        // Allow guest access
        $this->room->allow_guests = true;
        $this->room->save();
        $response = $this->get($download_link);
        $response->assertSuccessful();
    }

    /**
     * Test file download of file that is shared with participants of a room that requires an access code
     */
    public function test_download_files_download_with_access_code()
    {
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();
        $this->room->access_code = $this->createAccessCode();
        $this->room->save();
        $room_file = $this->room->files()->where('filename', $this->file_valid->name)->first();
        $room_file->download = true;
        $room_file->save();

        // Retrieve download link
        $download_link = $this->getJson(route('api.v1.rooms.files.get', ['room' => $this->room]))
            ->assertSuccessful()->json('data.0.url');

        Auth::logout();

        // Access as guest, without guest access and without access code
        $this->get($download_link)
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::GUESTS_NOT_ALLOWED->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.only_used_by_authenticated_users'),
            ]);

        // Create RoomAuthToken with token type code
        $currentSession = $this->startNewSession();

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $this->room->id,
            'type' => RoomAuthTokenType::CODE,
        ]);

        $roomAuthToken->save();

        // Access as guest, without guest access and with room auth token (type access code)
        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id.'&room_auth_token_type='.RoomAuthTokenType::CODE->value)
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::GUESTS_NOT_ALLOWED->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.only_used_by_authenticated_users'),
            ]);

        // Testing user without room auth token (type access code)
        $this->actingAs($this->user)
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link)
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_REQUIRE_CODE->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.require_access_code'),
            ]);

        // Testing user with room auth token (type access code)
        $currentSession = $this->startNewSession($this->user);

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $this->room->id,
            'type' => RoomAuthTokenType::CODE,
        ]);

        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id.'&room_auth_token_type='.RoomAuthTokenType::CODE->value)
            ->assertSuccessful();

        // Testing user with room auth token (type access code) but no access code needed
        $this->room->access_code = null;
        $this->room->save();

        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id.'&room_auth_token_type='.RoomAuthTokenType::CODE->value)
            ->assertSuccessful();

        // Reset access code
        $this->room->access_code = $this->createAccessCode();
        $this->room->save();

        // Create new session and room auth token (old ones are invalid now after access code changes)
        $currentSession = $this->startNewSession($this->user);

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $this->room->id,
            'type' => RoomAuthTokenType::CODE,
        ]);

        $roomAuthToken->save();

        // Testing user with invalid room auth token
        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token=invalidToken&room_auth_token_type='.RoomAuthTokenType::CODE->value)
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);

        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$this->faker->uuid().'&room_auth_token_type='.RoomAuthTokenType::CODE->value)
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.access_code_invalid'),
            ]);

        // Testing with valid room auth token but invalid token type
        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id)
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);

        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id.'&room_auth_token_type='.RoomAuthTokenType::PERSONALIZED_LINK->value)
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);

        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id.'&room_auth_token_type=invalidTokenType')
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);

        // Testing member
        $this->room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->get($download_link)
            ->assertSuccessful();

        // Testing moderator member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->get($download_link)
            ->assertSuccessful();

        // Testing owner
        $this->actingAs($this->room->owner)->get($download_link)
            ->assertSuccessful();

        // Remove membership roles and test with view all permission
        $this->room->members()->sync([]);
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->get($download_link)
            ->assertSuccessful();

        Auth::logout();

        // Allow guest access
        $this->room->allow_guests = true;
        $this->room->save();

        // Access as guest, with guest access and without room auth token
        $this->get($download_link)
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_REQUIRE_CODE->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.require_access_code'),
            ]);

        // Access as guest, with guest access and room auth token
        $currentSession = $this->startNewSession();

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $this->room->id,
            'type' => RoomAuthTokenType::CODE,
        ]);

        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id.'&room_auth_token_type='.RoomAuthTokenType::CODE->value)
            ->assertSuccessful();

        // Download as guest with room auth token but no access code needed
        $this->room->access_code = null;
        $this->room->save();

        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id.'&room_auth_token_type='.RoomAuthTokenType::CODE->value)
            ->assertSuccessful();

        // Reset access code
        $this->room->access_code = $this->createAccessCode();
        $this->room->save();

        // Create new session and room auth token (old ones are invalid now after access code changes)
        $currentSession = $this->startNewSession();

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $this->room->id,
            'type' => RoomAuthTokenType::CODE,
        ]);

        // Download as guest with invalid token
        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token=invalidToken&room_auth_token_type='.RoomAuthTokenType::CODE->value)
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);

        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$this->faker->uuid().'&room_auth_token_type='.RoomAuthTokenType::CODE->value)
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.access_code_invalid'),
            ]);

        // Download as guest with valid token but invalid token type
        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id)
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);

        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id.'&room_auth_token_type='.RoomAuthTokenType::PERSONALIZED_LINK->value)
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);

        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id.'&room_auth_token_type=invalidTokenType')
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);
    }

    public function test_download_files_download_with_token_type_token()
    {
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();
        $this->room->access_code = $this->createAccessCode();
        $this->room->save();
        $room_file = $this->room->files()->where('filename', $this->file_valid->name)->first();
        $room_file->download = true;
        $room_file->save();

        // Retrieve download link
        $response = $this->getJson(route('api.v1.rooms.files.get', ['room' => $this->room]))
            ->assertSuccessful();

        $download_link = $response->json('data.0.url');

        Auth::logout();

        // Create personalized link
        $link = RoomPersonalizedLink::factory()->create(['room_id' => $this->room->id]);
        $link->role = RoomUserRole::USER;
        $link->save();

        $currentSession = $this->startNewSession();

        $roomAuthToken = RoomAuthToken::factory()->create([
            'session_id' => $currentSession->id,
            'room_id' => $this->room->id,
            'type' => RoomAuthTokenType::PERSONALIZED_LINK,
            'room_personalized_link_id' => $link->id,
        ]);

        // Download as guest with token with room participant role
        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id.'&room_auth_token_type='.RoomAuthTokenType::PERSONALIZED_LINK->value)
            ->assertSuccessful();

        // Increase personalized link role to moderator
        $link->role = RoomUserRole::MODERATOR;
        $link->save();

        // Download as guest with personalized link with room moderator role
        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id.'&room_auth_token_type='.RoomAuthTokenType::PERSONALIZED_LINK->value)
            ->assertSuccessful();

        // Download as guest with invalid token
        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token=InvalidToken&room_auth_token_type='.RoomAuthTokenType::PERSONALIZED_LINK->value)
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);

        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$this->faker->uuid().'&room_auth_token_type='.RoomAuthTokenType::PERSONALIZED_LINK->value)
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.personalized_link_invalid'),
            ]);

        // Download as guest with token but invalid token type
        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id)
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);

        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id.'&room_auth_token_type='.RoomAuthTokenType::CODE->value)
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);

        $this
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id.'&room_auth_token_type=invalidTokenType')
            ->assertUnauthorized()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                'code' => 401,
                'title' => 'Invalid token',
                'message' => __('rooms.flash.auth_token_invalid'),
            ]);

        // Download as user with token
        $this->actingAs($this->user)
            ->withCookies([
                session()->getName() => $currentSession->id,
            ])
            ->get($download_link.'&room_auth_token='.$roomAuthToken->id.'&room_auth_token_type='.RoomAuthTokenType::PERSONALIZED_LINK->value)
            ->assertStatus(CustomStatusCodes::GUESTS_ONLY->value)
            ->assertViewHasAll([
                'type' => CustomErrorMessages::GUESTS_ONLY->value,
                'code' => CustomStatusCodes::GUESTS_ONLY->value,
                'title' => 'Guests only',
                'message' => __('app.flash.guests_only'),
            ]);
    }

    /**
     * Test get download url of file that is not downloadable with participants of a room
     */
    public function test_download_files_download_disabled()
    {
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();
        $this->room->allow_guests = true;
        $this->room->save();

        // Retrieve download link
        $response = $this->getJson(route('api.v1.rooms.files.get', ['room' => $this->room]))
            ->assertSuccessful();

        $download_link = $response->json('data.0.url');
        Auth::logout();

        // Access as guest
        $this->get($download_link)
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::FORBIDDEN->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.flash.file_forbidden'),
            ]);

        // Testing member
        $this->room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->get($download_link)
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::FORBIDDEN->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.flash.file_forbidden'),
            ]);

        // Testing moderator member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->get($download_link)
            ->assertForbidden()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::FORBIDDEN->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.flash.file_forbidden'),
            ]);

        // Testing owner
        $this->actingAs($this->room->owner)->get($download_link)
            ->assertSuccessful();

        // Remove membership roles and test with view all permission
        $this->room->members()->sync([]);
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->get($download_link)
            ->assertSuccessful();
    }

    /**
     * Check if download possible for a file from another room is working, if parameters in the url are changed
     */
    public function test_download_files_download_url_manipulation()
    {
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();

        $other_room = Room::factory()->create();

        $room_file = $this->room->files()->where('filename', $this->file_valid->name)->first();

        $download_link = URL::signedRoute('rooms.files.download', ['room' => $other_room->id, 'file' => $room_file->id, 'filename' => $room_file->filename]);

        // Testing for room without permission
        $this->actingAs($this->room->owner)->get($download_link)
            ->assertSee('type: "not_found"', false);

        // Testing for room with permission
        $other_room->owner()->associate($this->room->owner);
        $other_room->save();
        $this->actingAs($this->room->owner)->get($download_link)
            ->assertNotFound()
            ->assertSee('type: "not_found"', false);
    }

    /**
     * Testing download link given to bbb to download files
     */
    public function test_download_for_bbb()
    {
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();

        $room_file = $this->room->files()->where('filename', $this->file_valid->name)->first();

        Auth::logout();

        $downloadLink = URL::signedRoute('rooms.files.download.bbb', [
            'roomFile' => $room_file->id,
            'filename' => $room_file->filename,
        ]);

        $this->get($downloadLink)
            ->assertSuccessful();
    }

    /**
     * Testing download link for bbb for file that was deleted on the drive
     */
    public function test_download_for_bbb_for_file_deleted_from_drive()
    {
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();
        $room_file = $this->room->files()->where('filename', $this->file_valid->name)->first();

        Storage::disk('local')->assertExists($this->room->id.'/'.$this->file_valid->hashName());

        // delete file on the drive
        Storage::disk('local')->delete($this->room->id.'/'.$this->file_valid->hashName());

        Auth::logout();

        $downloadLink = URL::signedRoute('rooms.files.download.bbb', [
            'roomFile' => $room_file->id,
            'filename' => $room_file->filename,
        ]);

        $this->get($downloadLink)
            ->assertNotFound()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::FILE_NOT_FOUND->value,
                'code' => 404,
                'title' => 'File not found',
                'message' => __('rooms.flash.file_gone'),
            ]);
    }

    /**
     * Testing to delete uploaded files
     */
    public function test_files_delete()
    {
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();
        $room_file = $this->room->files()->where('filename', $this->file_valid->name)->first();

        Storage::disk('local')->assertExists($this->room->id.'/'.$this->file_valid->hashName());

        Auth::logout();

        // Testing guest
        $this->deleteJson(route('api.v1.rooms.files.destroy', ['room' => $this->room->id, 'file' => $room_file]))
            ->assertUnauthorized();

        // Testing user
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.files.destroy', ['room' => $this->room->id, 'file' => $room_file]))
            ->assertForbidden();

        // Testing member
        $this->room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.files.destroy', ['room' => $this->room->id, 'file' => $room_file]))
            ->assertForbidden();

        // Testing moderator member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.files.destroy', ['room' => $this->room->id, 'file' => $room_file]))
            ->assertForbidden();

        // Remove membership roles and test with view all permission
        $this->room->members()->sync([]);
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.files.destroy', ['room' => $this->room->id, 'file' => $room_file]))
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // test with manage permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.files.destroy', ['room' => $this->room->id, 'file' => $room_file]))
            ->assertSuccessful();
        $this->role->permissions()->detach($this->managePermission);

        // recreate file
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();
        $room_file = $this->room->files()->where('filename', $this->file_valid->name)->first();

        // Testing co-owner
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->deleteJson(route('api.v1.rooms.files.destroy', ['room' => $this->room->id, 'file' => $room_file]))
            ->assertSuccessful();

        // recreate file
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();
        $room_file = $this->room->files()->where('filename', $this->file_valid->name)->first();

        // Testing owner
        $this->actingAs($this->room->owner)->deleteJson(route('api.v1.rooms.files.destroy', ['room' => $this->room->id, 'file' => $room_file]))
            ->assertSuccessful();

        // Testing delete again
        $this->actingAs($this->room->owner)->deleteJson(route('api.v1.rooms.files.destroy', ['room' => $this->room->id, 'file' => $room_file]))
            ->assertNotFound()
            ->assertJson([
                'message' => 'model_not_found',
                'model' => 'room_file',
                'ids' => [
                    $room_file->id,
                ],
            ]);

        // Check if file was deleted as well
        Storage::disk('local')->assertMissing($this->room->id.'/'.$this->file_valid->hashName());
    }

    /**
     * Testing to access file that was deleted on the drive
     */
    public function test_download_deleted_file_from_drive()
    {
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();
        $room_file = $this->room->files()->where('filename', $this->file_valid->name)->first();

        Storage::disk('local')->assertExists($this->room->id.'/'.$this->file_valid->hashName());

        // delete file on the drive
        Storage::disk('local')->delete($this->room->id.'/'.$this->file_valid->hashName());

        $download_link = URL::signedRoute('rooms.files.download', ['room' => $this->room->id, 'file' => $room_file->id, 'filename' => $room_file->filename]);

        // Download file
        $this->get($download_link)
            ->assertNotFound()
            ->assertViewIs('new-tab-error')
            ->assertViewHasAll([
                'type' => CustomErrorMessages::FILE_NOT_FOUND->value,
                'code' => 404,
                'title' => 'File not found',
                'message' => __('rooms.flash.file_gone'),
            ]);

        // Check if model was deleted as well
        $this->assertDatabaseMissing('room_files', ['id' => $room_file->id]);
    }

    /**
     * Test if delete is working or bypassing permission by manipulating route parameters
     */
    public function test_delete_file_url_manipulation()
    {
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();

        $other_room = Room::factory()->create();

        $room_file = $this->room->files()->where('filename', $this->file_valid->name)->first();

        // Testing for room without permission
        $this->actingAs($this->room->owner)->deleteJson(route('api.v1.rooms.files.destroy', ['room' => $other_room->id, 'file' => $room_file]))
            ->assertNotFound()
            ->assertJson([
                'message' => 'model_not_found',
                'model' => 'room_file',
                'ids' => [
                    $room_file->id,
                ],
            ]);

        // Testing for room with permission
        $other_room->owner()->associate($this->room->owner);
        $other_room->save();
        $this->actingAs($this->room->owner)->deleteJson(route('api.v1.rooms.files.destroy', ['room' => $other_room->id, 'file' => $room_file]))
            ->assertNotFound()
            ->assertJson([
                'message' => 'model_not_found',
                'model' => 'room_file',
                'ids' => [
                    $room_file->id,
                ],
            ]);
    }

    /**
     * Test updating file attributes
     */
    public function test_update_file()
    {
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $this->file_valid])
            ->assertSuccessful();
        $room_file = $this->room->files()->where('filename', $this->file_valid->name)->first();

        $room_file->use_in_meeting = false;
        $room_file->download = false;
        $room_file->save();

        Storage::disk('local')->assertExists($this->room->id.'/'.$this->file_valid->hashName());

        Auth::logout();

        $route = route('api.v1.rooms.files.update', ['room' => $this->room->id, 'file' => $room_file]);
        $params = [
            'use_in_meeting' => true,
            'download' => true,
            'default' => false,
        ];

        // Testing guest
        $this->putJson($route, $params)
            ->assertUnauthorized();

        // Testing user
        $this->actingAs($this->user)->putJson($route, $params)
            ->assertForbidden();

        // Testing member
        $this->room->members()->attach($this->user, ['role' => RoomUserRole::USER]);
        $this->actingAs($this->user)->putJson($route, $params)
            ->assertForbidden();

        // Testing moderator member
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::MODERATOR]]);
        $this->actingAs($this->user)->putJson($route, $params)
            ->assertForbidden();

        // Testing co-owner
        $this->room->members()->sync([$this->user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $this->actingAs($this->user)->putJson($route, $params)
            ->assertSuccessful();

        // Testing owner
        $this->actingAs($this->room->owner)->putJson($route, $params)
            ->assertSuccessful();

        // Remove membership roles and test with view all permission
        $this->room->members()->sync([]);
        $this->user->roles()->attach($this->role);
        $this->role->permissions()->attach($this->viewAllPermission);
        $this->actingAs($this->user)->putJson($route, $params)
            ->assertForbidden();
        $this->role->permissions()->detach($this->viewAllPermission);

        // test with manage permission
        $this->role->permissions()->attach($this->managePermission);
        $this->actingAs($this->user)->putJson($route, $params)
            ->assertSuccessful();
        $this->role->permissions()->detach($this->managePermission);

        $room_file->refresh();

        $this->assertTrue($room_file->use_in_meeting);
        $this->assertTrue($room_file->download);
        $this->assertTrue($room_file->default); // Manually setting default to false is forbidden

        // Testing for other room
        $other_room = Room::factory()->create();
        // Testing for room without permission
        $this->actingAs($this->room->owner)->putJson(route('api.v1.rooms.files.update', ['room' => $other_room->id, 'file' => $room_file]), $params)
            ->assertNotFound()
            ->assertJson([
                'message' => 'model_not_found',
                'model' => 'room_file',
                'ids' => [
                    $room_file->id,
                ],
            ]);

        // Testing for room with permission
        $other_room->owner()->associate($this->room->owner);
        $other_room->save();
        $this->actingAs($this->room->owner)->putJson(route('api.v1.rooms.files.update', ['room' => $other_room->id, 'file' => $room_file]), $params)
            ->assertNotFound()
            ->assertJson([
                'message' => 'model_not_found',
                'model' => 'room_file',
                'ids' => [
                    $room_file->id,
                ],
            ]);

        // Testing missing properties
        $params = [];
        $this->actingAs($this->room->owner)->putJson($route, $params)
            ->assertJsonValidationErrors(['use_in_meeting', 'download', 'default']);

        // Testing invalid properties
        $params = [
            'use_in_meeting' => 'invalid',
            'download' => 'invalid',
            'default' => 'invalid',
        ];

        $this->actingAs($this->room->owner)->putJson($route, $params)
            ->assertJsonValidationErrors(['use_in_meeting', 'download', 'default']);

        // Test deleted
        $room_file->delete();
        $this->actingAs($this->room->owner)->putJson($route, $params)
            ->assertNotFound()
            ->assertJson([
                'message' => 'model_not_found',
                'model' => 'room_file',
                'ids' => [
                    $room_file->id,
                ],
            ]);

        // Test deleted room
        $this->room->delete();

        $this->actingAs($this->room->owner)->putJson($route, $params)
            ->assertNotFound()
            ->assertJson([
                'message' => 'model_not_found',
                'model' => 'room',
                'ids' => [
                    $this->room->id,
                ],
            ]);
    }

    /**
     * Test setting file default
     */
    public function test_update_default()
    {
        $file_1 = UploadedFile::fake()->create('document1.pdf', config('bigbluebutton.max_filesize') - 1, 'application/pdf');
        $file_2 = UploadedFile::fake()->create('document2.pdf', config('bigbluebutton.max_filesize') - 1, 'application/pdf');

        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $file_1])
            ->assertSuccessful();
        $this->actingAs($this->room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $this->room]), ['file' => $file_2])
            ->assertSuccessful();

        $room_file_1 = $this->room->files()->where('filename', $file_1->name)->first();
        $room_file_2 = $this->room->files()->where('filename', $file_2->name)->first();

        $this->assertFalse($room_file_1->default);
        $this->assertFalse($room_file_1->use_in_meeting);

        $this->assertFalse($room_file_2->default);
        $this->assertFalse($room_file_2->use_in_meeting);

        // Set new default without use_in_meeting
        $this->actingAs($this->room->owner)->putJson(route('api.v1.rooms.files.update', ['room' => $this->room->id, 'file' => $room_file_2]), ['download' => false, 'default' => true, 'use_in_meeting' => false])
            ->assertSuccessful();
        $room_file_1->refresh();
        $room_file_2->refresh();
        $this->assertFalse($room_file_1->default);
        $this->assertFalse($room_file_1->use_in_meeting);
        $this->assertFalse($room_file_2->default);
        $this->assertFalse($room_file_2->use_in_meeting);

        // Set new default with use_in_meeting
        $this->actingAs($this->room->owner)->putJson(route('api.v1.rooms.files.update', ['room' => $this->room->id, 'file' => $room_file_1]), ['download' => false, 'default' => false, 'use_in_meeting' => true])
            ->assertSuccessful();
        $this->actingAs($this->room->owner)->putJson(route('api.v1.rooms.files.update', ['room' => $this->room->id, 'file' => $room_file_2]), ['download' => false, 'default' => false, 'use_in_meeting' => true])
            ->assertSuccessful();
        $room_file_1->refresh();
        $room_file_2->refresh();
        $this->assertTrue($room_file_1->default);
        $this->assertTrue($room_file_1->use_in_meeting);
        $this->assertFalse($room_file_2->default);
        $this->assertTrue($room_file_2->use_in_meeting);

        // Remove current default
        $this->actingAs($this->room->owner)->deleteJson(route('api.v1.rooms.files.destroy', ['room' => $this->room->id, 'file' => $room_file_1]))
            ->assertSuccessful();
        $room_file_2->refresh();
        $this->assertTrue($room_file_2->default);
        $this->assertTrue($room_file_2->use_in_meeting);
    }

    /**
     * Testing to start a meeting with a file
     */
    public function test_start_meeting_with_file()
    {
        $room = Room::factory()->create();
        $server = Server::factory()->create();

        $room->roomType->serverPool->servers()->attach($server);

        // Create Fake BBB-Server
        $bbbfaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);
        $bbbfaker->addCreateMeetingRequest();

        // Upload a fake file
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $room]), ['file' => $this->file_valid])
            ->assertSuccessful();

        $file = $room->files->first();

        // Set file to be used in next meeting
        $this->actingAs($room->owner)->putJson(route('api.v1.rooms.files.update', ['room' => $room, 'file' => $file->id]), ['download' => false, 'default' => false, 'use_in_meeting' => true])
            ->assertSuccessful();

        // Start room
        $response = $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])

            ->assertSuccessful();
        $this->assertIsString($response->json('url'));

        // Get request send to BBB Server
        $request = $bbbfaker->getRequest(0);

        // Get xml from request (presentation data)
        $xml = simplexml_load_string($request->body());

        $downloadUrl = (string) $xml->module->document->attributes()->url;
        $fileName = (string) $xml->module->document->attributes()->filename;

        // Check if file name is correctly send to BBB Server
        $this->assertEquals($this->file_valid->name, $fileName);

        // Simulate BBB-Server downloading file
        $fileResponse = $this->get($downloadUrl);
        $fileResponse->assertSuccessful();

        // Check if file headers for reverse proxy are correctly set
        $this->assertEquals('/private-storage/app/'.$room->id.'/'.$this->file_valid->hashName(), $fileResponse->headers->get('x-accel-redirect'));
    }
}
