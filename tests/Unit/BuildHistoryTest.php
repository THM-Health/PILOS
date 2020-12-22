<?php

namespace Tests\Unit;

use App\Enums\ServerStatus;
use App\Meeting;
use App\Room;
use App\Server;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class BuildHistoryTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * If server is offline/not reachable, reset usage numbers, mark as offline and end all meetings marked as running
     */
    public function testServerOffline()
    {
        // Create new meeting with fake server
        $meeting                         = factory(Meeting::class)->create(['end'=>null]);
        $server                          = $meeting->server;
        $room                            = $meeting->room;

        // Set the live usage data of server and parent room
        $server->participant_count       = 5;
        $server->listener_count          = 5;
        $server->voice_participant_count = 5;
        $server->video_count             = 5;
        $server->meeting_count           = 5;
        $server->save();

        $room->participant_count       = 5;
        $room->listener_count          = 5;
        $room->voice_participant_count = 5;
        $room->video_count             = 5;
        $room->save();

        // Refresh usage and build history
        $this->artisan('history:build');

        // Reload data and check if everything is reset, as the server is offline
        $server->refresh();
        $this->assertEquals(ServerStatus::OFFLINE, $server->status);
        $this->assertNull($server->participant_count);
        $this->assertNull($server->listener_count);
        $this->assertNull($server->voice_participant_count);
        $this->assertNull($server->video_count);
        $this->assertNull($server->meeting_count);

        $meeting->refresh();
        $this->assertNotNull($meeting->end);

        $room->refresh();
        $this->assertNull($room->participant_count);
        $this->assertNull($room->listener_count);
        $this->assertNull($room->voice_participant_count);
        $this->assertNull($room->video_count);
    }

    /**
     * If server is offline/not reachable, reset usage numbers, mark as offline and end all meetings marked as running
     */
    public function testServerDisabled()
    {
        // Create new meeting with fake server
        $server                          = factory(Server::class)->create();

        // Set the live usage data of server and parent room
        $server->participant_count       = 5;
        $server->listener_count          = 5;
        $server->voice_participant_count = 5;
        $server->video_count             = 5;
        $server->meeting_count           = 5;
        $server->status                  = ServerStatus::DISABLED;
        $server->save();

        // Refresh usage and build history
        $this->artisan('history:build');

        // Reload data and check if everything is reset, as the server is offline
        $server->refresh();
        $this->assertEquals(ServerStatus::DISABLED, $server->status);
        $this->assertNull($server->participant_count);
        $this->assertNull($server->listener_count);
        $this->assertNull($server->voice_participant_count);
        $this->assertNull($server->video_count);
        $this->assertNull($server->meeting_count);
    }

    /**
     * Test if live and archival usage data is created
     */
    public function testServerOnline()
    {
        $room = factory(Room::class)->create([]);
        setting(['log_attendance' => false]);

        // Adding server(s)
        $this->seed('ServerSeeder');

        // Start meeting
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertSuccessful();
        $this->assertIsString($response->json('url'));

        // Get new meeting
        $runningMeeting = $room->runningMeeting();

        // Refresh usage and build history
        $this->artisan('history:build');

        // Check meeting archival data
        $this->assertEquals(1, $runningMeeting->stats()->count());
        $this->assertNotNull($runningMeeting->stats->last()->participant_count);
        $this->assertNotNull($runningMeeting->stats->last()->listener_count);
        $this->assertNotNull($runningMeeting->stats->last()->voice_participant_count);
        $this->assertNotNull($runningMeeting->stats->last()->video_count);
        $this->assertNull($runningMeeting->stats->last()->attendees);

        // Check room live data
        $runningMeeting->room->refresh();
        $this->assertNotNull($runningMeeting->room->participant_count);
        $this->assertNotNull($runningMeeting->room->listener_count);
        $this->assertNotNull($runningMeeting->room->voice_participant_count);
        $this->assertNotNull($runningMeeting->room->video_count);

        // Check server archival data
        $this->assertEquals(1, $runningMeeting->server->stats()->count());
        $this->assertNotNull($runningMeeting->server->stats->last()->participant_count);
        $this->assertNotNull($runningMeeting->server->stats->last()->listener_count);
        $this->assertNotNull($runningMeeting->server->stats->last()->voice_participant_count);
        $this->assertNotNull($runningMeeting->server->stats->last()->video_count);
        $this->assertNotNull($runningMeeting->server->stats->last()->meeting_count);

        // Check server live data
        $runningMeeting->server->refresh();
        $this->assertNotNull($runningMeeting->server->participant_count);
        $this->assertNotNull($runningMeeting->server->listener_count);
        $this->assertNotNull($runningMeeting->server->voice_participant_count);
        $this->assertNotNull($runningMeeting->server->video_count);
        $this->assertNotNull($runningMeeting->server->meeting_count);

        // Cleanup
        $this->assertTrue($runningMeeting->endMeeting());
    }

    /**
     * Check if attendance is getting logged
     */
    public function testLogAttendance()
    {
        $room = factory(Room::class)->create([]);
        setting(['log_attendance' => true]);

        // Adding server(s)
        $this->seed('ServerSeeder');

        // Start meeting
        $response = $this->actingAs($room->owner)->getJson(route('api.v1.rooms.start', ['room'=>$room]))
            ->assertSuccessful();
        $this->assertIsString($response->json('url'));

        // Get new meeting
        $runningMeeting = $room->runningMeeting();

        // Refresh usage and build history
        $this->artisan('history:build');

        // Check if array with attendees was created
        $this->assertNotNull($runningMeeting->stats->last()->attendees);

        // Cleanup
        $this->assertTrue($runningMeeting->endMeeting());
    }
}
