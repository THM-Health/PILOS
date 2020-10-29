<?php

namespace Tests\Unit;

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
        $server->status = 0;
        $server->save();
        $this->assertNull($server->getMeetings());
        $server->status = 1;
        $server->save();

        // Server marked as offline
        $server->offline = 1;
        $server->save();
        $this->assertNull($server->getMeetings());
        $server->offline = 0;
        $server->save();

        // Server marked as offline and inactive
        $server->offline = 1;
        $server->status  = 0;
        $server->save();
        $this->assertNull($server->getMeetings());
        $server->offline = 0;
        $server->status  = 1;
        $server->save();

        // Test with invalid domain name
        $server->baseUrl = 'https://fake.notld/bigbluebutton/';
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

        $serverMock->offline = 0;
        $serverMock->status  = 1;

        self::assertNull($serverMock->getMeetings());
    }
}
