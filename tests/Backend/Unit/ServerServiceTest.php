<?php

namespace Tests\Backend\Unit;

use App\Enums\ServerHealth;
use App\Enums\ServerStatus;
use App\Events\RoomEnded;
use App\Models\Meeting;
use App\Models\Server;
use App\Models\User;
use App\Services\ServerService;
use Http;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Tests\Backend\TestCase;
use TiMacDonald\Log\LogEntry;
use TiMacDonald\Log\LogFake;

class ServerServiceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test getMeetings response for different server status and wrong api details
     */
    public function test_get_meetings_with_status_and_offline()
    {
        $server = Server::factory()->create();
        $server->base_url = 'https://fake.notld/bigbluebutton/';
        $server->save();
        $serverService = new ServerService($server);

        // Server marked as disabled
        $server->status = ServerStatus::DISABLED;
        $server->save();
        $this->assertNull($serverService->getMeetings());

        // Server marked as draining
        $server->status = ServerStatus::DRAINING;
        $server->save();
        $this->assertNull($serverService->getMeetings());

        // Online, but with invalid domain name
        $server->status = ServerStatus::ENABLED;
        $server->save();
        $this->assertNull($serverService->getMeetings());
    }

    /**
     * Test if server response is correctly passed through
     */
    public function test_get_meetings_with_response()
    {
        Http::fake([
            'test.notld/bigbluebutton/api/getMeetings*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-3.xml')),
        ]);

        $server = Server::factory()->create();
        $serverService = new ServerService($server);

        $server->offline = 0;
        $server->status = 1;

        $meetings = $serverService->getMeetings();
        self::assertCount(2, $meetings);
        self::assertEquals('409e94ee-e317-4040-8cb2-8000a289b49d', $meetings[0]->getMeetingId());
        self::assertEquals('216b94ffe-a225-3041-ac62-5000a289b49d', $meetings[1]->getMeetingId());
    }

    /**
     * Test if a failed server response results in empty response
     */
    public function test_get_meetings_with_failed_response()
    {
        Http::fake([
            'test.notld/bigbluebutton/api/getMeetings*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/Failed.xml')),
        ]);

        $server = Server::factory()->create();
        $serverService = new ServerService($server);

        $server->status = ServerStatus::ENABLED;

        self::assertNull($serverService->getMeetings());
    }

    /**
     * Check if attendance is getting logged
     */
    public function test_log_attendance()
    {
        Log::swap(new LogFake);

        Http::fake([
            'test.notld/bigbluebutton/api/getMeetings*' => Http::sequence()
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-1.xml'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-2.xml'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-End.xml')),
        ]);

        $server = Server::factory()->create();
        $serverService = new ServerService($server);

        $meeting = Meeting::factory()->create(['id' => '409e94ee-e317-4040-8cb2-8000a289b49d', 'start' => '2021-06-25 09:24:25', 'end' => null, 'record_attendance' => true]);
        $meeting->server()->associate($server);
        $meeting->save();

        $userA = User::factory()->create(['id' => 99, 'firstname' => 'Mable', 'lastname' => 'Torres', 'email' => 'm.torres@example.net']);
        $userB = User::factory()->create(['id' => 100, 'firstname' => 'Gregory', 'lastname' => 'Dumas', 'email' => 'g.dumas@example.net']);

        $serverService->updateUsage(updateAttendance: true);
        $meeting->refresh();

        // Check attendance data after first run

        // Count total attendance datasets
        $this->assertCount(4, $meeting->attendees);

        // Check if users are added correct
        $attendeeUserA = $meeting->attendees()->where('user_id', 99)->first();
        $this->assertTrue($attendeeUserA->user->is($userA));
        $this->assertNull($attendeeUserA->name);
        $this->assertNull($attendeeUserA->session_id);
        $this->assertNull($attendeeUserA->leave);
        $this->assertNotNull($attendeeUserA->join);

        // Check if guests are added correct
        $attendeeGuestA = $meeting->attendees()->where('session_id', 'PogeR6XH8I2SAeCqc8Cp5y5bD9Qq70dRxe4DzBcb')->first();
        $this->assertEquals('Marie Walker', $attendeeGuestA->name);
        $this->assertNull($attendeeGuestA->user);
        $this->assertNull($attendeeGuestA->leave);
        $this->assertNotNull($attendeeGuestA->join);

        // Check if errors are logged
        Log::assertLogged(
            fn (LogEntry $log) => $log->level === 'notice'
                && $log->message == 'Unknown prefix for attendee found.'
                && $log->context == ['prefix' => '2', 'meeting' => '409e94ee-e317-4040-8cb2-8000a289b49d']
        );
        Log::assertLogged(
            fn (LogEntry $log) => $log->level === 'notice'
                && $log->message == 'Attendee user not found.'
                && $log->context == ['user' => '101', 'meeting' => '409e94ee-e317-4040-8cb2-8000a289b49d']
        );

        $serverService->updateUsage(updateAttendance: true);
        $meeting->refresh();

        // Count total attendance datasets
        $this->assertCount(4, $meeting->attendees);

        // Check if user and guest session end got detected
        $attendeeUserA = $meeting->attendees()->where('user_id', 99)->first();
        $this->assertNotNull($attendeeUserA->leave);
        $attendeeGuestA = $meeting->attendees()->where('session_id', 'PogeR6XH8I2SAeCqc8Cp5y5bD9Qq70dRxe4DzBcb')->first();
        $this->assertNotNull($attendeeGuestA->leave);

        // Check if user and guest sessions of the other users are not ended
        $attendeeUserA = $meeting->attendees()->where('user_id', 100)->first();
        $this->assertNull($attendeeUserA->leave);
        $attendeeGuestA = $meeting->attendees()->where('session_id', 'LQC1Pb5TSBn2EM5njylocogXPgIQIknKQcvcWMRG')->first();
        $this->assertNull($attendeeGuestA->leave);

        $serverService->updateUsage(updateAttendance: true);
        $meeting->refresh();

        // Count total attendance datasets, should increase as two new sessions exists
        $this->assertCount(6, $meeting->attendees);

        // Check if the new session for the user is added
        $attendeeUserA = $meeting->attendees()->where('user_id', 99)->get();
        $this->assertNotNull($attendeeUserA[0]->leave);
        $this->assertNotNull($attendeeUserA[0]->join);
        $this->assertNull($attendeeUserA[1]->leave);
        $this->assertNotNull($attendeeUserA[1]->join);

        // Check if the new session for the guest is added
        $attendeeGuestA = $meeting->attendees()->where('session_id', 'PogeR6XH8I2SAeCqc8Cp5y5bD9Qq70dRxe4DzBcb')->get();
        $this->assertNotNull($attendeeGuestA[0]->leave);
        $this->assertNotNull($attendeeGuestA[0]->join);
        $this->assertNull($attendeeGuestA[1]->leave);
        $this->assertNotNull($attendeeGuestA[1]->join);

        $serverService->updateUsage(updateAttendance: true);
        $meeting->refresh();

        // Check if end time is set after meeting ended
        foreach ($meeting->attendees as $attendee) {
            $this->assertNotNull($attendee->leave);
        }
    }

    /**
     * Check if attendance is not getting logged if disabled
     */
    public function test_log_attendance_disabled()
    {
        Http::fake([
            'test.notld/bigbluebutton/api/getMeetings*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml')),
        ]);

        $server = Server::factory()->create();
        $serverService = new ServerService($server);

        // Check if attendance is not logged if disabled for this meeting
        $meeting = Meeting::factory()->create(['id' => '409e94ee-e317-4040-8cb2-8000a289b49d', 'start' => '2021-06-25 09:24:25', 'end' => null, 'record_attendance' => false]);
        $meeting->server()->associate($server);
        $meeting->save();
        $serverService->updateUsage(updateAttendance: true);
        $meeting->refresh();
        $this->assertCount(0, $meeting->attendees);
    }

    /**
     * Check if the version is getting updated
     */
    public function test_version_update()
    {
        $server = Server::factory()->create(['version' => '2.3.0']);

        Http::fake([
            'test.notld/bigbluebutton/api/getMeetings*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-End.xml')),
            'test.notld/bigbluebutton/api/?checksum=*' => Http::sequence()
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetApiVersion.xml'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetApiVersion-Disabled.xml'))
                ->pushResponse(fn () => throw new ConnectionException('Connection timed out'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/ChecksumError.xml')),
        ]);

        $serverService = new ServerService($server);

        // Update with response
        $serverService->updateUsage();
        $server->refresh();
        $this->assertEquals('2.4-rc-7', $server->version);

        // Update with disabled response
        $serverService->updateUsage();
        $server->refresh();
        $this->assertNull($server->version);

        // Update with server timeout
        $serverService->updateUsage();
        $server->refresh();
        $this->assertNull($server->version);

        // Update with checksum error
        $serverService->updateUsage();
        $server->refresh();
        $this->assertNull($server->version);
    }

    public function test_server_health_failing()
    {
        config([
            'bigbluebutton.server_online_threshold' => 3,
            'bigbluebutton.server_offline_threshold' => 3,
        ]);

        Http::fake([
            'test.notld/bigbluebutton/api/getMeetings*' => Http::sequence()
                ->pushResponse(fn () => throw new ConnectionException('Connection timed out'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml'))
                ->pushResponse(fn () => throw new ConnectionException('Connection timed out'))
                ->pushResponse(fn () => throw new ConnectionException('Connection timed out')),
        ]);

        // Create server
        $server = Server::factory()->create();
        $serverService = new ServerService($server);

        // First fail
        $serverService->updateUsage();

        $server->refresh();
        $this->assertEquals(ServerHealth::UNHEALTHY, $server->health);

        // Recover
        $serverService->updateUsage();

        $server->refresh();
        $this->assertEquals(ServerHealth::UNHEALTHY, $server->health);

        // Fail again (2 fail)
        $serverService->updateUsage();

        $server->refresh();
        $this->assertEquals(ServerHealth::UNHEALTHY, $server->health);

        // Fail again (3 fail)
        $serverService->updateUsage();

        $server->refresh();
        $this->assertEquals(ServerHealth::OFFLINE, $server->health);
    }

    public function test_server_health_single_failure()
    {
        config([
            'bigbluebutton.server_online_threshold' => 3,
            'bigbluebutton.server_offline_threshold' => 3,
        ]);

        Http::fake([
            'test.notld/bigbluebutton/api/getMeetings*' => Http::sequence()
                ->pushResponse(fn () => throw new ConnectionException('Connection timed out'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml')),
        ]);

        // Create server
        $server = Server::factory()->create();
        $serverService = new ServerService($server);

        // First fail
        $serverService->updateUsage();

        $server->refresh();
        $this->assertEquals(ServerHealth::UNHEALTHY, $server->health);

        // Recover (1 recover)
        $serverService->updateUsage();

        $server->refresh();
        $this->assertEquals(ServerHealth::UNHEALTHY, $server->health);

        // Recover (2 recover)
        $serverService->updateUsage();

        $server->refresh();
        $this->assertEquals(ServerHealth::UNHEALTHY, $server->health);

        // Recover (3 recover)
        $serverService->updateUsage();

        $server->refresh();
        $this->assertEquals(ServerHealth::ONLINE, $server->health);
    }

    public function test_server_health_recovering()
    {
        config([
            'bigbluebutton.server_online_threshold' => 3,
            'bigbluebutton.server_offline_threshold' => 3,
        ]);

        Http::fake([
            'test.notld/bigbluebutton/api/getMeetings*' => Http::sequence()
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml'))
                ->pushResponse(fn () => throw new ConnectionException('Connection timed out'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml')),
        ]);

        // Create server
        $server = Server::factory()->create(['error_count' => config('bigbluebutton.server_offline_threshold'), 'recover_count' => 0]);
        $serverService = new ServerService($server);

        // Recover (1 recover)
        $serverService->updateUsage();

        $server->refresh();
        $this->assertEquals(ServerHealth::OFFLINE, $server->health);

        // Fail again
        $serverService->updateUsage();

        $server->refresh();
        $this->assertEquals(ServerHealth::OFFLINE, $server->health);

        // Recover (1 new recover)
        $serverService->updateUsage();

        $server->refresh();
        $this->assertEquals(ServerHealth::OFFLINE, $server->health);

        // Recover (2 new recover)
        $serverService->updateUsage();

        $server->refresh();
        $this->assertEquals(ServerHealth::OFFLINE, $server->health);

        // Recover (3 new recover)
        $serverService->updateUsage();

        $server->refresh();
        $this->assertEquals(ServerHealth::ONLINE, $server->health);
    }

    public function test_detach_meeting_on_offline()
    {
        config([
            'bigbluebutton.server_online_threshold' => 3,
            'bigbluebutton.server_offline_threshold' => 3,
        ]);

        Http::fake([
            'test.notld/bigbluebutton/api/getMeetings*' => Http::sequence()
                ->pushResponse(fn () => throw new ConnectionException('Connection timed out'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml'))
                ->pushResponse(fn () => throw new ConnectionException('Connection timed out'))
                ->pushResponse(fn () => throw new ConnectionException('Connection timed out')),
        ]);

        // Create server
        $server = Server::factory()->create();
        $serverService = new ServerService($server);

        // Create meeting
        $meeting = Meeting::factory()->create(['id' => '409e94ee-e317-4040-8cb2-8000a289b49d', 'server_id' => $server->id, 'end' => null]);

        // First fail
        $serverService->updateUsage();

        $server->refresh();
        $meeting->refresh();
        $this->assertEquals(ServerHealth::UNHEALTHY, $server->health);
        $this->assertNull($meeting->detached);

        // Recover
        $serverService->updateUsage();

        $server->refresh();
        $meeting->refresh();
        $this->assertEquals(ServerHealth::UNHEALTHY, $server->health);
        $this->assertNull($meeting->detached);

        // Fail again (2 fail)
        $serverService->updateUsage();

        $server->refresh();
        $meeting->refresh();
        $this->assertEquals(ServerHealth::UNHEALTHY, $server->health);
        $this->assertNull($meeting->detached);

        // Fail again (3 fail)
        $serverService->updateUsage();

        $server->refresh();
        $meeting->refresh();
        $this->assertEquals(ServerHealth::OFFLINE, $server->health);
        $this->assertNotNull($meeting->detached);
    }

    public function test_end_detached_meeting_on_online()
    {
        Event::fake([
            RoomEnded::class,
        ]);

        config([
            'bigbluebutton.server_online_threshold' => 3,
            'bigbluebutton.server_offline_threshold' => 3,
        ]);

        Http::fake([
            'test.notld/bigbluebutton/api/getMeetings*' => Http::sequence()
                ->pushResponse(fn () => throw new ConnectionException('Connection timed out'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml')),
            'test.notld/bigbluebutton/api/end?meetingID=409e94ee-e317-4040-8cb2-8000a289b49d&checksum=*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/EndMeeting.xml')),
        ]);

        // Create server
        $server = Server::factory()->create(['error_count' => config('bigbluebutton.server_offline_threshold'), 'recover_count' => 0]);
        $serverService = new ServerService($server);

        // Create detached meeting
        $meeting = Meeting::factory()->create(['id' => '409e94ee-e317-4040-8cb2-8000a289b49d', 'server_id' => $server->id, 'end' => null, 'detached' => now()]);

        // Continue failing
        $serverService->updateUsage();

        $server->refresh();
        $meeting->refresh();
        $this->assertEquals(ServerHealth::OFFLINE, $server->health);
        $this->assertNotNull($meeting->detached);
        $this->assertNull($meeting->end);

        // Recover
        $serverService->updateUsage();

        $server->refresh();
        $meeting->refresh();
        $this->assertEquals(ServerHealth::OFFLINE, $server->health);
        $this->assertNotNull($meeting->detached);
        $this->assertNotNull($meeting->end);

        // Check if meeting ended event is fired
        Event::assertDispatched(RoomEnded::class);
    }

    public function test_panic_server()
    {
        Event::fake([
            RoomEnded::class,
        ]);

        $server = Server::factory()->create();

        $meeting1 = Meeting::factory()->create(['server_id' => $server->id]);
        $meeting1->end = null;
        $meeting1->save();

        $meeting2 = Meeting::factory()->create(['server_id' => $server->id]);
        $meeting2->end = null;
        $meeting2->save();

        Http::fake([
            'test.notld/bigbluebutton/api/end?meetingID='.$meeting1->id.'&checksum=*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/EndMeeting.xml')),
            'test.notld/bigbluebutton/api/end?meetingID='.$meeting2->id.'&checksum=*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/EndMeeting.xml')),
        ]);

        $serverService = new ServerService($server);
        $result = $serverService->panic();

        $this->assertEquals(['total' => 2, 'success' => 2], $result);

        $server->refresh();
        $meeting1->refresh();
        $meeting2->refresh();

        $this->assertEquals(ServerStatus::DISABLED, $server->status);
        $this->assertNotNull($meeting1->end);
        $this->assertNotNull($meeting2->end);

        // Check if meeting ended event is fired
        Event::assertDispatched(RoomEnded::class);
    }

    public function test_panic_server_with_failed_end_meeting()
    {

        $server = Server::factory()->create();

        $meeting1 = Meeting::factory()->create(['server_id' => $server->id]);
        $meeting1->end = null;
        $meeting1->save();

        $meeting2 = Meeting::factory()->create(['server_id' => $server->id]);
        $meeting2->end = null;
        $meeting2->save();

        Http::fake([
            'test.notld/bigbluebutton/api/end?meetingID='.$meeting1->id.'&checksum=*' => fn () => throw new ConnectionException('Connection timed out'),
            'test.notld/bigbluebutton/api/end?meetingID='.$meeting2->id.'&checksum=*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/EndMeeting.xml')),
        ]);

        $serverService = new ServerService($server);
        $result = $serverService->panic();

        $this->assertEquals(['total' => 2, 'success' => 1], $result);

        $server->refresh();
        $meeting1->refresh();
        $meeting2->refresh();

        $this->assertEquals(ServerStatus::DISABLED, $server->status);
        $this->assertNull($meeting1->end);
        $this->assertNotNull($meeting2->end);
    }

    public function test_server_draining()
    {
        Http::fake([
            'test.notld/bigbluebutton/api/getMeetings*' => Http::sequence()
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-End.xml')),
        ]);

        $server = Server::factory()->create(['status' => ServerStatus::DRAINING]);
        $serverService = new ServerService($server);

        // check if server is not disabled if meetings are left
        Meeting::factory()->create(['id' => '409e94ee-e317-4040-8cb2-8000a289b49d', 'end' => null, 'server_id' => $server->id]);

        $serverService->updateUsage();

        $server->refresh();
        $this->assertEquals(ServerStatus::DRAINING, $server->status);

        // Test if server is disabled on next poll if meeting is ended
        $serverService->updateUsage();

        $server->refresh();
        $this->assertEquals(ServerStatus::DISABLED, $server->status);
    }

    public function test_server_load()
    {
        config([
            'plugins.enabled' => [''],
        ]);

        Http::fake([
            'test.notld/bigbluebutton/api/getMeetings*' => Http::sequence()
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml')),
        ]);

        // Create server
        $server = Server::factory()->create();
        $serverService = new ServerService($server);

        // Update server load
        $serverService->updateUsage();

        // Check if load is correctly calculated (amount of participants)
        $server->refresh();
        $this->assertEquals(6, $server->load);
    }

    public function test_server_load_with_plugin()
    {
        config([
            'plugins.enabled' => ['ServerLoadCalculationPlugin'],
            'plugins.namespaces.custom' => 'Tests\Backend\Utils',
        ]);

        Http::fake([
            'test.notld/bigbluebutton/api/getMeetings*' => Http::sequence()
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/GetMeetings-Start.xml')),
        ]);

        // Create server
        $server = Server::factory()->create();
        $serverService = new ServerService($server);

        // Update server load
        $serverService->updateUsage();

        // Check if load is correctly calculated (amount of participants)
        $server->refresh();
        $this->assertEquals(12, $server->load);
    }
}
