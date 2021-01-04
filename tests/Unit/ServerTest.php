<?php

namespace Tests\Unit;

use App\Enums\ServerStatus;
use App\Server;
use BigBlueButton\BigBlueButton;
use BigBlueButton\Responses\GetMeetingsResponse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class ServerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test getMeetings response for different server status and wrong api details
     */
    public function testGetMeetingsWithStatusAndOffline()
    {
        $server = factory(Server::class)->create();

        // Server marked as inactive
        $server->status = ServerStatus::DISABLED;
        $server->save();
        $this->assertNull($server->getMeetings());
        $server->status = ServerStatus::ONLINE;
        $server->save();

        // Server marked as offline
        $server->status = ServerStatus::OFFLINE;
        $server->save();
        $this->assertNull($server->getMeetings());
        $server->status = ServerStatus::ONLINE;
        $server->save();

        // Test with invalid domain name
        $server->base_url = 'https://fake.notld/bigbluebutton/';
        $server->save();
        $this->assertNull($server->getMeetings());
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

        $serverMock = Mockery::mock(Server::class, function ($mock) use ($bbbMock) {
            $mock->shouldReceive('bbb')
                ->once()
                ->andReturn($bbbMock);
        })->makePartial();

        $serverMock->offline = 0;
        $serverMock->status  = 1;

        self::assertEquals('test-response', $serverMock->getMeetings());
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

        $serverMock = Mockery::mock(Server::class, function ($mock) use ($bbbMock) {
            $mock->shouldReceive('bbb')
                ->once()
                ->andReturn($bbbMock);
        })->makePartial();

        $serverMock->status = ServerStatus::ONLINE;

        self::assertNull($serverMock->getMeetings());
    }

    /**
     * Test if closure resets current usage for offline and not for online
     */
    public function testUsageClearedOnOffline()
    {
        // Create new fake server
        $server                          = factory(Server::class)->create();

        // Set the live usage data of server
        $server->participant_count       = 1;
        $server->listener_count          = 2;
        $server->voice_participant_count = 3;
        $server->video_count             = 4;
        $server->meeting_count           = 5;
        $server->status                  = ServerStatus::ONLINE;
        $server->save();

        $server->refresh();
        $this->assertEquals(ServerStatus::ONLINE, $server->status);
        $this->assertEquals(1, $server->participant_count);
        $this->assertEquals(2, $server->listener_count);
        $this->assertEquals(3, $server->voice_participant_count);
        $this->assertEquals(4, $server->video_count);
        $this->assertEquals(5, $server->meeting_count);

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
    }

    /**
     * Test if closure resets current usage for disabled
     */
    public function testUsageClearedOnDisabled()
    {
        // Create new fake server
        $server                          = factory(Server::class)->create();

        // Set the live usage data of server
        $server->participant_count       = 1;
        $server->listener_count          = 2;
        $server->voice_participant_count = 3;
        $server->video_count             = 4;
        $server->meeting_count           = 5;
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
    }
}
