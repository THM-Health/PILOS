<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Tests\Backend\Feature\api\v1\Room;

use App\Enums\RoomLobby;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Server;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;
use Tests\Backend\Utils\BigBlueButtonServerFaker;

/**
 * Test room create call parameters with different lobby settings
 */
class RoomLobbyTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    /**
     * Setup resources for all tests
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

        // Create fake BBB-Server
        $server = Server::factory()->create();
        $roomTypeLobbyEnabledEnforced->serverPool->servers()->attach($server);
        $bbbFaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);

        // Start meeting
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room1->owner)->postJson(route('api.v1.rooms.start', ['room' => $room1]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room2->owner)->postJson(route('api.v1.rooms.start', ['room' => $room2]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room3->owner)->postJson(route('api.v1.rooms.start', ['room' => $room3]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Check waiting room parameters in create call
        $this->assertEquals('ASK_MODERATOR', $bbbFaker->getRequest(0)->data()['guestPolicy']);
        $this->assertEquals('ASK_MODERATOR', $bbbFaker->getRequest(1)->data()['guestPolicy']);
        $this->assertEquals('ASK_MODERATOR', $bbbFaker->getRequest(2)->data()['guestPolicy']);
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

        // Create fake BBB-Server
        $server = Server::factory()->create();
        $roomTypeLobbyDisabledDefault->serverPool->servers()->attach($server);
        $roomTypeLobbyEnabledDefault->serverPool->servers()->attach($server);
        $bbbFaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);

        // Start meeting
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room1->owner)->postJson(route('api.v1.rooms.start', ['room' => $room1]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room2->owner)->postJson(route('api.v1.rooms.start', ['room' => $room2]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Check waiting room parameters in create call
        $this->assertEquals('ASK_MODERATOR', $bbbFaker->getRequest(0)->data()['guestPolicy']);
        $this->assertEquals('ASK_MODERATOR', $bbbFaker->getRequest(1)->data()['guestPolicy']);
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

        // Create fake BBB-Server
        $server = Server::factory()->create();
        $roomTypeLobbyEnabledDefault->serverPool->servers()->attach($server);
        $bbbFaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);

        // Start meeting
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Check waiting room parameters in create call
        $this->assertEquals('ASK_MODERATOR', $bbbFaker->getRequest(0)->data()['guestPolicy']);
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

        // Create fake BBB-Server
        $server = Server::factory()->create();
        $roomTypeLobbyOnlyGuestsEnforced->serverPool->servers()->attach($server);
        $bbbFaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);

        // Start meeting
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room1->owner)->postJson(route('api.v1.rooms.start', ['room' => $room1]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room2->owner)->postJson(route('api.v1.rooms.start', ['room' => $room2]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room3->owner)->postJson(route('api.v1.rooms.start', ['room' => $room3]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Check waiting room parameters in create call
        $this->assertEquals('ALWAYS_ACCEPT_AUTH', $bbbFaker->getRequest(0)->data()['guestPolicy']);
        $this->assertEquals('ALWAYS_ACCEPT_AUTH', $bbbFaker->getRequest(1)->data()['guestPolicy']);
        $this->assertEquals('ALWAYS_ACCEPT_AUTH', $bbbFaker->getRequest(2)->data()['guestPolicy']);
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

        // Create fake BBB-Server
        $server = Server::factory()->create();
        $roomTypeLobbyDisabledDefault->serverPool->servers()->attach($server);
        $roomTypeLobbyOnlyGuestsDefault->serverPool->servers()->attach($server);
        $bbbFaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);

        // Start meeting
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room1->owner)->postJson(route('api.v1.rooms.start', ['room' => $room1]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room2->owner)->postJson(route('api.v1.rooms.start', ['room' => $room2]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Check waiting room parameters in create call
        $this->assertEquals('ALWAYS_ACCEPT_AUTH', $bbbFaker->getRequest(0)->data()['guestPolicy']);
        $this->assertEquals('ALWAYS_ACCEPT_AUTH', $bbbFaker->getRequest(1)->data()['guestPolicy']);
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

        // Create fake BBB-Server
        $server = Server::factory()->create();
        $roomTypeLobbyOnlyGuestsDefault->serverPool->servers()->attach($server);
        $bbbFaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);

        // Start meeting
        $bbbFaker->addCreateMeetingRequest();
        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();

        // Check waiting room parameters in create call
        $this->assertEquals('ALWAYS_ACCEPT_AUTH', $bbbFaker->getRequest(0)->data()['guestPolicy']);
    }
}
