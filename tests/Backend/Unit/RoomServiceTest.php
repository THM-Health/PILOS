<?php

declare(strict_types=1);

namespace Backend\Unit;

use App\Models\Room;
use App\Models\Server;
use App\Services\MeetingService;
use App\Services\RoomService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;
use Tests\Backend\Utils\BigBlueButtonServerFaker;

class RoomServiceTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private $room;

    protected function setUp(): void
    {
        parent::setUp();

        // Create room
        $this->room = Room::factory()->create(['access_code' => '123456789']);
    }

    public function test_start_dial_in()
    {
        config(['bigbluebutton.invalid_dial_numbers' => ['0', '0000']]);

        $server = Server::factory()->create();
        $bbbFaker = new BigBlueButtonServerFaker($server->base_url, $server->secret);
        $bbbFaker->addCreateMeetingRequest();
        $bbbFaker->addCreateMeetingRequest();

        $this->room->roomType->serverPool->servers()->attach($server);

        // Start new meeting, result has a valid dial-in number
        $roomService = new RoomService($this->room);
        $roomService->start();

        // Check meeting was created
        $this->room->refresh();
        $this->assertCount(1, $this->room->meetings);

        // Check dial-in number and voice-bridge (pin) are set
        $meeting = $this->room->latestMeeting;
        $this->assertEquals('613-555-1234', $meeting->dial_number);
        $this->assertEquals('02443', $meeting->voice_bridge);

        // Set meeting as ended
        $meetingService = new MeetingService($meeting);
        $meetingService->setEnd();

        // Change list of invalid dial-in numbers
        config(['bigbluebutton.invalid_dial_numbers' => ['0', '0000', '613-555-1234']]);

        // Start new meeting, result has an invalid dial-in number
        $roomService->start();

        // Check another meeting was created
        $this->room->refresh();
        $this->assertCount(2, $this->room->meetings);

        // Check dial-in number and voice-bridge (pin) are not set
        $meeting = $this->room->latestMeeting;
        $this->assertNull($meeting->dial_number);
        $this->assertNull($meeting->voice_bridge);
    }
}
