<?php

namespace Tests\Backend\Unit\Console;

use App\Enums\ServerHealth;
use App\Models\Meeting;
use App\Models\Room;
use App\Models\Server;
use App\Models\User;
use Carbon\Carbon;
use Http;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;
use Tests\Backend\Utils\BigBlueButtonServerFaker;

class PollServerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * If server is offline/not reachable, reset usage numbers, mark as offline and end all meetings marked as running
     */
    public function test_server_offline()
    {
        config([
            'bigbluebutton.server_online_threshold' => 2,
            'bigbluebutton.server_offline_threshold' => 2,
        ]);

        // Create new meeting with fake server
        $meeting = Meeting::factory()->create(['id' => '409e94ee-e317-4040-8cb2-8000a289b49d', 'end' => null]);
        $server = $meeting->server;
        $room = $meeting->room;

        // Set the live usage data of server and parent room
        $server->participant_count = 5;
        $server->listener_count = 5;
        $server->voice_participant_count = 5;
        $server->video_count = 5;
        $server->meeting_count = 5;
        $server->save();

        $room->participant_count = 5;
        $room->listener_count = 5;
        $room->voice_participant_count = 5;
        $room->video_count = 5;
        $room->save();

        // Poll server, first time failing
        $this->artisan('server:poll');

        // Check if health is set to unhealthy
        $server->refresh();
        $this->assertEquals(ServerHealth::UNHEALTHY, $server->health);

        // Check if live usage data is not reset during unhealthy state
        $this->assertNotNull($server->participant_count);
        $this->assertNotNull($room->participant_count);

        // Poll server, second time failing
        $this->artisan('server:poll');

        // Check if health is set to offline
        $server->refresh();
        $this->assertEquals(ServerHealth::OFFLINE, $server->health);

        // Check if live usage data is reset
        $this->assertNull($server->participant_count);
        $this->assertNull($server->listener_count);
        $this->assertNull($server->voice_participant_count);
        $this->assertNull($server->video_count);
        $this->assertNull($server->meeting_count);

        // Check if live usage data is reset
        $room->refresh();
        $this->assertNull($room->participant_count);
        $this->assertNull($room->listener_count);
        $this->assertNull($room->voice_participant_count);
        $this->assertNull($room->video_count);

    }

    /**
     * Test if live and archival usage data is created
     */
    public function test_server_online()
    {
        $user99 = User::factory()->create(['id' => 99]);
        $user100 = User::factory()->create(['id' => 100]);
        $user101 = User::factory()->create(['id' => 101]);

        $meeting = Meeting::factory()->create(['id' => '409e94ee-e317-4040-8cb2-8000a289b49d', 'record_attendance' => true]);
        $this->recordingSettings->server_usage_enabled = true;
        $this->recordingSettings->meeting_usage_enabled = true;
        $this->recordingSettings->save();

        // Create fake BBB-Server
        $bbbfaker = new BigBlueButtonServerFaker($meeting->server->base_url, $meeting->server->secret);
        // Get 4 times the list of meetings and 4 times the API version
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetMeetings-Start.xml')));
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetApiVersion.xml')));
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetMeetings-1.xml')));
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetApiVersion.xml')));
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetMeetings-2.xml')));
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetApiVersion.xml')));
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetMeetings-3.xml')));
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetApiVersion.xml')));

        // Refresh usage and build history
        $this->travelTo(Carbon::create(2023, 9, 28, 12, 00, 00));
        $this->artisan('server:poll');

        // Check meeting archival data
        $this->assertEquals(1, $meeting->stats()->count());
        $this->assertEquals(6, $meeting->stats->last()->participant_count);
        $this->assertEquals(3, $meeting->stats->last()->listener_count);
        $this->assertEquals(3, $meeting->stats->last()->voice_participant_count);
        $this->assertEquals(2, $meeting->stats->last()->video_count);

        // Check room live data
        $meeting->room->refresh();
        $this->assertEquals(6, $meeting->room->participant_count);
        $this->assertEquals(3, $meeting->room->listener_count);
        $this->assertEquals(3, $meeting->room->voice_participant_count);
        $this->assertEquals(2, $meeting->room->video_count);

        // Check server archival data
        $this->assertEquals(1, $meeting->server->stats()->count());
        $this->assertNotNull(6, $meeting->server->stats->last()->participant_count);
        $this->assertNotNull(3, $meeting->server->stats->last()->listener_count);
        $this->assertNotNull(3, $meeting->server->stats->last()->voice_participant_count);
        $this->assertNotNull(2, $meeting->server->stats->last()->video_count);
        $this->assertEquals(1, $meeting->server->stats->last()->meeting_count);

        // Check server live data
        $meeting->server->refresh();
        $this->assertEquals(6, $meeting->server->participant_count);
        $this->assertEquals(3, $meeting->server->listener_count);
        $this->assertEquals(3, $meeting->server->voice_participant_count);
        $this->assertEquals(2, $meeting->server->video_count);
        $this->assertEquals(1, $meeting->server->meeting_count);

        // check with disabled server stats
        $this->recordingSettings->server_usage_enabled = false;
        $this->recordingSettings->meeting_usage_enabled = true;
        $this->recordingSettings->save();
        $this->travelTo(Carbon::create(2023, 9, 28, 12, 01, 00));
        $this->artisan('server:poll');
        $this->assertEquals(1, $meeting->server->stats()->count());
        $this->assertEquals(2, $meeting->stats()->count());

        // check with disabled meeting stats
        $this->recordingSettings->server_usage_enabled = true;
        $this->recordingSettings->meeting_usage_enabled = false;
        $this->recordingSettings->save();
        $this->travelTo(Carbon::create(2023, 9, 28, 12, 02, 00));
        $this->artisan('server:poll');
        $this->assertEquals(2, $meeting->server->stats()->count());
        $this->assertEquals(2, $meeting->stats()->count());

        // Check attendance data
        $attendees = $meeting->attendees()->orderBy('id')->get();

        $this->assertEquals('Marie Walker', $attendees[0]->name);
        $this->assertEquals('2023-09-28 12:00:00', $attendees[0]->join->format('Y-m-d H:i:s'));
        $this->assertEquals('2023-09-28 12:01:00', $attendees[0]->leave->format('Y-m-d H:i:s'));

        $this->assertEquals('Bertha Luff', $attendees[1]->name);
        $this->assertEquals('2023-09-28 12:00:00', $attendees[1]->join->format('Y-m-d H:i:s'));
        $this->assertNull($attendees[1]->leave);

        $this->assertTrue($user99->is($attendees[2]->user));
        $this->assertEquals('2023-09-28 12:00:00', $attendees[2]->join->format('Y-m-d H:i:s'));
        $this->assertEquals('2023-09-28 12:01:00', $attendees[2]->leave->format('Y-m-d H:i:s'));

        $this->assertTrue($user100->is($attendees[3]->user));
        $this->assertEquals('2023-09-28 12:00:00', $attendees[3]->join->format('Y-m-d H:i:s'));
        $this->assertNull($attendees[3]->leave);

        $this->assertTrue($user101->is($attendees[4]->user));
        $this->assertEquals('2023-09-28 12:00:00', $attendees[4]->join->format('Y-m-d H:i:s'));
        $this->assertEquals('2023-09-28 12:01:00', $attendees[4]->leave->format('Y-m-d H:i:s'));

        $this->assertEquals('Marie Walker', $attendees[5]->name);
        $this->assertEquals('2023-09-28 12:02:00', $attendees[5]->join->format('Y-m-d H:i:s'));
        $this->assertNull($attendees[5]->leave);

        $this->assertTrue($user99->is($attendees[6]->user));
        $this->assertEquals('2023-09-28 12:02:00', $attendees[6]->join->format('Y-m-d H:i:s'));
        $this->assertNull($attendees[6]->leave);
    }

    /**
     * Test if live and archival usage data is created
     */
    public function test_server_online_disabled_attendance_recording()
    {
        $meeting = Meeting::factory()->create(['id' => '409e94ee-e317-4040-8cb2-8000a289b49d', 'record_attendance' => false]);

        // Create fake BBB-Server
        $bbbfaker = new BigBlueButtonServerFaker($meeting->server->base_url, $meeting->server->secret);
        // Get 4 times the list of meetings and 4 times the API version
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetMeetings-Start.xml')));
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetApiVersion.xml')));
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetMeetings-1.xml')));
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetApiVersion.xml')));
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetMeetings-2.xml')));
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetApiVersion.xml')));
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetMeetings-3.xml')));
        $bbbfaker->addRequest(fn () => Http::response(file_get_contents(__DIR__.'/../../Fixtures/GetApiVersion.xml')));

        // Refresh usage and build history
        $this->travelTo(Carbon::create(2023, 9, 28, 12, 00, 00));
        $this->artisan('server:poll');

        $this->travelTo(Carbon::create(2023, 9, 28, 12, 01, 00));
        $this->artisan('server:poll');

        $this->travelTo(Carbon::create(2023, 9, 28, 12, 02, 00));
        $this->artisan('server:poll');

        // Check attendance data missing
        $this->assertEquals(0, $meeting->attendees->count());
    }
}
