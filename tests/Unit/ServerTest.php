<?php

namespace Tests\Unit;

use App\Enums\ServerStatus;
use App\Models\Meeting;
use App\Models\Server;
use App\Models\User;
use App\Services\ServerService;
use BigBlueButton\BigBlueButton;
use BigBlueButton\Responses\ApiVersionResponse;
use BigBlueButton\Responses\GetMeetingsResponse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\TestCase;
use TiMacDonald\Log\LogEntry;
use TiMacDonald\Log\LogFake;

class ServerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test getMeetings response for different server status and wrong api details
     */
    public function testGetMeetingsWithStatusAndOffline()
    {
        $server        = Server::factory()->create();
        $serverService = new ServerService($server);

        // Server marked as inactive
        $server->status = ServerStatus::DISABLED;
        $server->save();
        $this->assertNull($serverService->getMeetings());
        $server->status = ServerStatus::ONLINE;
        $server->save();

        // Server marked as offline
        $server->status = ServerStatus::OFFLINE;
        $server->save();
        $this->assertNull($serverService->getMeetings());
        $server->status = ServerStatus::ONLINE;
        $server->save();

        // Test with invalid domain name
        $server->base_url = 'https://fake.notld/bigbluebutton/';
        $server->save();
        $this->assertNull($serverService->getMeetings());
    }

    /**
     * Test if server response is correctly passed through
     */
    public function testGetMeetingsWithResponse()
    {
        $bbbResponseMock = Mockery::mock(GetMeetingsResponse::class, function ($mock) {
            $mock->shouldReceive('failed')
                ->once()
                ->andReturn(false);
            $mock->shouldReceive('getMeetings')
                ->once()
                ->andReturn('test-response');
        });

        $bbbMock = Mockery::mock(BigBlueButton::class, function ($mock) use ($bbbResponseMock) {
            $mock->shouldReceive('getMeetings')
                ->once()
                ->andReturn($bbbResponseMock);
        });

        $server        = Server::factory()->create();
        $serverService = new ServerService($server);
        $serverService->setBigBlueButton($bbbMock);
        $server->offline = 0;
        $server->status  = 1;

        self::assertEquals('test-response', $serverService->getMeetings());
    }

    /**
     * Test if a failed server response results in empty response
     */
    public function testGetMeetingsWithFailedResponse()
    {
        $bbbReponseMock = Mockery::mock(GetMeetingsResponse::class, function ($mock) {
            $mock->shouldReceive('failed')
                ->once()
                ->andReturn(true);
        });

        $bbbMock = Mockery::mock(BigBlueButton::class, function ($mock) use ($bbbReponseMock) {
            $mock->shouldReceive('getMeetings')
                ->once()
                ->andReturn($bbbReponseMock);
        });

        $server        = Server::factory()->create();
        $serverService = new ServerService($server);
        $serverService->setBigBlueButton($bbbMock);

        $server->status = ServerStatus::ONLINE;

        self::assertNull($serverService->getMeetings());
    }

    /**
     * Test if closure resets current usage for offline and not for online
     */
    public function testUsageClearedOnOffline()
    {
        // Create new fake server
        $server                          = Server::factory()->create();

        // Set the live usage data of server
        $server->participant_count       = 1;
        $server->listener_count          = 2;
        $server->voice_participant_count = 3;
        $server->video_count             = 4;
        $server->meeting_count           = 5;
        $server->version                 = '2.4.5';
        $server->status                  = ServerStatus::ONLINE;
        $server->save();

        $server->refresh();
        $this->assertEquals(ServerStatus::ONLINE, $server->status);
        $this->assertEquals(1, $server->participant_count);
        $this->assertEquals(2, $server->listener_count);
        $this->assertEquals(3, $server->voice_participant_count);
        $this->assertEquals(4, $server->video_count);
        $this->assertEquals(5, $server->meeting_count);
        $this->assertEquals('2.4.5', $server->version);

        $server->status                  = ServerStatus::OFFLINE;
        $server->save();

        // Reload data and check if everything is reset, as the server is offline
        $server->refresh();
        $this->assertEquals(ServerStatus::OFFLINE, $server->status);
        $this->assertNull($server->participant_count);
        $this->assertNull($server->listener_count);
        $this->assertNull($server->voice_participant_count);
        $this->assertNull($server->video_count);
        $this->assertNull($server->meeting_count);
        $this->assertNull($server->version);
    }

    /**
     * Test if closure resets current usage for disabled
     */
    public function testUsageClearedOnDisabled()
    {
        // Create new fake server
        $server                          = Server::factory()->create();

        // Set the live usage data of server
        $server->participant_count       = 1;
        $server->listener_count          = 2;
        $server->voice_participant_count = 3;
        $server->video_count             = 4;
        $server->meeting_count           = 5;
        $server->version                 = '2.4.5';
        $server->status                  = ServerStatus::ONLINE;
        $server->save();

        $server->refresh();
        $server->status                  = ServerStatus::DISABLED;
        $server->save();

        // Reload data and check if everything is reset, as the server is disabled
        $server->refresh();
        $this->assertEquals(ServerStatus::DISABLED, $server->status);
        $this->assertNull($server->participant_count);
        $this->assertNull($server->listener_count);
        $this->assertNull($server->voice_participant_count);
        $this->assertNull($server->video_count);
        $this->assertNull($server->meeting_count);
        $this->assertNull($server->version);
    }

    /**
     * Check if attendance is getting logged
     */
    public function testLogAttendance()
    {
        Log::swap(new LogFake);
        setting(['attendance.enabled'=>true]);

        $bbbMock = Mockery::mock(BigBlueButton::class, function ($mock) {
            $mock->shouldReceive('getMeetings')->once()->andReturn(new GetMeetingsResponse(simplexml_load_file(__DIR__.'/../Fixtures/Attendance/GetMeetings-Start.xml')));
            $mock->shouldReceive('getMeetings')->once()->andReturn(new GetMeetingsResponse(simplexml_load_file(__DIR__.'/../Fixtures/Attendance/GetMeetings-1.xml')));
            $mock->shouldReceive('getMeetings')->once()->andReturn(new GetMeetingsResponse(simplexml_load_file(__DIR__.'/../Fixtures/Attendance/GetMeetings-2.xml')));
            $mock->shouldReceive('getMeetings')->once()->andReturn(new GetMeetingsResponse(simplexml_load_file(__DIR__.'/../Fixtures/Attendance/GetMeetings-End.xml')));
        });

        $server        = Server::factory()->create();
        $serverService = new ServerService($server);
        $serverService->setBigBlueButton($bbbMock);

        $meeting = Meeting::factory()->create(['id'=> '409e94ee-e317-4040-8cb2-8000a289b49d','start'=>'2021-06-25 09:24:25','end'=>null,'record_attendance'=>true,'attendee_pw'=> 'asdfgh32343','moderator_pw'=> 'h6gfdew423']);
        $meeting->server()->associate($server);
        $meeting->save();

        $userA = User::factory()->create(['id'=>99,'firstname'=> 'Mable', 'lastname' => 'Torres', 'email' => 'm.torres@example.net']);
        $userB = User::factory()->create(['id'=>100,'firstname'=> 'Gregory', 'lastname' => 'Dumas', 'email' => 'g.dumas@example.net']);

        $serverService->updateUsage();
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
            fn (LogEntry $log) =>
            $log->level === 'notice'
            && $log->message == 'Unknown prefix for attendee found.'
            && $log->context == ['prefix' => '2','meeting'=> '409e94ee-e317-4040-8cb2-8000a289b49d']
        );
        Log::assertLogged(
            fn (LogEntry $log) =>
            $log->level === 'notice'
            && $log->message == 'Attendee user not found.'
            && $log->context == ['user' => '101','meeting'=> '409e94ee-e317-4040-8cb2-8000a289b49d']
        );

        $serverService->updateUsage();
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

        $serverService->updateUsage();
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

        $serverService->updateUsage();
        $meeting->refresh();

        // Check if end time is set after meeting ended
        foreach ($meeting->attendees as $attendee) {
            $this->assertNotNull($attendee->leave);
        }
    }

    /**
     * Check if attendance is not getting logged if disabled
     */
    public function testLogAttendanceDisabled()
    {
        setting(['attendance.enabled'=>false]);

        $bbbMock = Mockery::mock(BigBlueButton::class, function ($mock) {
            $mock->shouldReceive('getMeetings')->andReturn(new GetMeetingsResponse(simplexml_load_file(__DIR__.'/../Fixtures/Attendance/GetMeetings-Start.xml')));
        });

        $server        = Server::factory()->create();
        $serverService = new ServerService($server);
        $serverService->setBigBlueButton($bbbMock);

        $meeting = Meeting::factory()->create(['id'=> '409e94ee-e317-4040-8cb2-8000a289b49d','start'=>'2021-06-25 09:24:25','end'=>null,'record_attendance'=>true,'attendee_pw'=> 'asdfgh32343','moderator_pw'=> 'h6gfdew423']);
        $meeting->server()->associate($server);
        $meeting->save();

        // Check if attendance is not logged if enabled for this meeting, but disabled globally
        $serverService->updateUsage();
        $meeting->refresh();
        $this->assertCount(0, $meeting->attendees);

        // Check if attendance is not logged if disabled for this meeting, but enabled globally
        setting(['attendance.enabled'=>true]);
        $meeting->record_attendance = false;
        $meeting->save();
        $serverService->updateUsage();
        $meeting->refresh();
        $this->assertCount(0, $meeting->attendees);
    }

    /**
     * Check if the version is getting updated
     */
    public function testVersionUpdate()
    {
        $bbbMock = Mockery::mock(BigBlueButton::class, function ($mock) {
            $mock->shouldReceive('getMeetings')->once()->andReturn(new GetMeetingsResponse(simplexml_load_file(__DIR__.'/../Fixtures/Attendance/GetMeetings-End.xml')));
            $mock->shouldReceive('getApiVersion')->once()->andReturn(new ApiVersionResponse(simplexml_load_file(__DIR__.'/../Fixtures/GetApiVersion.xml')));

            $mock->shouldReceive('getMeetings')->once()->andReturn(new GetMeetingsResponse(simplexml_load_file(__DIR__.'/../Fixtures/Attendance/GetMeetings-End.xml')));
            $mock->shouldReceive('getApiVersion')->once()->andReturn(new ApiVersionResponse(simplexml_load_file(__DIR__.'/../Fixtures/GetApiVersion-Disabled.xml')));
        });

        $server        = Server::factory()->create(['version' => '2.3.0']);
        $serverService = new ServerService($server);
        $serverService->setBigBlueButton($bbbMock);

        $serverService->updateUsage();
        $server->refresh();
        $this->assertEquals('2.4-rc-7', $server->version);

        $serverService->updateUsage();
        $server->refresh();
        $this->assertNull($server->version);
    }
}
