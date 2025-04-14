<?php

namespace Tests\Backend\Unit;

use App\Models\Meeting;
use App\Models\Room;
use App\Models\Server;
use App\Services\StreamingService;
use Http;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Backend\TestCase;

class StreamingServiceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Setup resources for all tests
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Create room for streaming
        $this->room = Room::factory()->create();
        $this->room->streaming->enabled_for_current_meeting = true;
        $this->room->streaming->save();

        // Create new meeting
        $this->meeting = new Meeting;
        $this->meeting->room()->associate($this->room);
        $this->meeting->start = now();
        $this->meeting->server()->associate(Server::factory()->create(['base_url' => 'https://bbb.example.com/bigbluebutton/']));
        $this->meeting->save();
        $this->room->latestMeeting()->associate($this->meeting);
        $this->room->save();

        $this->streamingService = new StreamingService($this->meeting);
    }

    public function test_get_status()
    {
        config([
            'streaming.api' => 'https://streaming.example.com',
            'streaming.auth.type' => 'basic',
            'streaming.auth.basic.username' => 'user',
            'streaming.auth.basic.password' => 'password',
        ]);

        $streamingJobHash = hash('sha256', $this->meeting->id.'@bbb.example.com');

        // Mock the streaming service
        Http::preventStrayRequests();
        Http::fake([
            'streaming.example.com/'.$streamingJobHash => Http::sequence()
                ->push([
                    'id' => $streamingJobHash,
                    'progress' => [
                        'status' => 'paused',
                        'fps' => 25,
                        'bitrate' => 4500,
                    ],
                ])
                ->push('Server error', 500)
                ->push('Job not found', 404)
                ->pushFailedConnection(),
        ]);

        // Test status and fps are correctly fetched
        $this->assertTrue($this->streamingService->getStatus());
        $this->room->streaming->refresh();
        $this->assertEquals('paused', $this->room->streaming->status);
        $this->assertEquals(25, $this->room->streaming->fps);

        // Test server error, should not change status
        $this->assertFalse($this->streamingService->getStatus());
        $this->room->streaming->refresh();
        $this->assertEquals('paused', $this->room->streaming->status);
        $this->assertEquals(25, $this->room->streaming->fps);

        // Test streaming job not found
        $this->assertTrue($this->streamingService->getStatus());
        $this->room->streaming->refresh();
        $this->assertNull($this->room->streaming->status);
        $this->assertNull($this->room->streaming->fps);

        // Failed connection
        $this->assertFalse($this->streamingService->getStatus());
    }

    public function test_start()
    {
        config([
            'streaming.api' => 'https://streaming.example.com',
            'streaming.auth.type' => 'basic',
            'streaming.auth.basic.username' => 'user',
            'streaming.auth.basic.password' => 'password',
        ]);

        $this->room->streaming->enabled_for_current_meeting = true;
        $this->room->streaming->url = 'rtmp://example.com/live/1234';
        $this->room->streaming->pause_image = 'https://example.com/image.jpg';
        $this->room->streaming->save();

        $this->room->roomType->streamingSettings->default_pause_image = 'https://example.com/room_type_default_image.jpg';
        $this->room->roomType->streamingSettings->save();

        $streamingSettings = app(\App\Settings\StreamingSettings::class);
        $streamingSettings->default_pause_image = 'https://example.com/system_default_image.jpg';
        $streamingSettings->save();

        $streamingJobHash = hash('sha256', $this->meeting->id.'@bbb.example.com');

        // Mock the streaming service
        $createResponse = [
            'id' => $streamingJobHash,
            'progress' => [
                'status' => 'queued',
                'fps' => null,
                'bitrate' => null,
            ],
        ];
        Http::preventStrayRequests();
        Http::fake([
            'streaming.example.com/' => Http::sequence()
                ->push($createResponse)
                ->push($createResponse)
                ->push($createResponse)
                ->push($createResponse)
                ->push($createResponse)
                ->pushFailedConnection(),
        ]);

        // Test is status and fps are correctly fetched
        $this->assertTrue($this->streamingService->start());
        $this->room->streaming->refresh();
        $this->assertEquals('queued', $this->room->streaming->status);
        $this->assertNull($this->room->streaming->fps);

        // Validate request send to streaming service
        $request = Http::recorded()->pop()[0];
        // Validate auth
        $this->assertEquals('Basic '.base64_encode('user:password'), $request->header('Authorization')[0]);
        // Validate pause image
        $this->assertEquals('https://example.com/image.jpg', $request->data()['pauseImageUrl']);
        // Validate rtmp url
        $this->assertEquals('rtmp://example.com/live/1234', $request->data()['rtmpUrl']);
        // Validate join url
        $joinUrl = $request->data()['joinUrl'];
        $joinUrlParsed = parse_url($joinUrl);
        parse_str($joinUrlParsed['query'], $joinUrlParams);
        $this->assertEquals('bbb.example.com', $joinUrlParsed['host']);
        $this->assertEquals('/bigbluebutton/api/join', $joinUrlParsed['path']);
        $this->assertEquals($this->room->latestMeeting->id, $joinUrlParams['meetingID']);
        $this->assertEquals('Livestream', $joinUrlParams['fullName']);
        $this->assertEquals('http://localhost/images/livestream_avatar.png', $joinUrlParams['avatarURL']);
        $this->assertEquals('MODERATOR', $joinUrlParams['role']);

        // Start streaming without pause image, fallback to room type default image
        $this->room->streaming->pause_image = null;
        $this->room->streaming->save();
        $this->assertTrue($this->streamingService->start());

        // Validate request send to streaming service
        $request = Http::recorded()->pop()[0];
        // Validate pause image
        $this->assertEquals('https://example.com/room_type_default_image.jpg', $request->data()['pauseImageUrl']);

        // Start streaming without pause image and no pause image in room type, fallback to system default image
        $this->room->roomType->streamingSettings->default_pause_image = null;
        $this->room->roomType->streamingSettings->save();
        $this->assertTrue($this->streamingService->start());

        // Validate request send to streaming service
        $request = Http::recorded()->pop()[0];
        // Validate pause image
        $this->assertEquals('https://example.com/system_default_image.jpg', $request->data()['pauseImageUrl']);

        // Test without any pause image
        $streamingSettings->default_pause_image = null;
        $streamingSettings->save();
        $this->assertTrue($this->streamingService->start());

        // Validate request send to streaming service
        $request = Http::recorded()->pop()[0];
        // Validate pause image
        $this->assertNull($request->data()['pauseImageUrl']);

        // Use custom css file and custom api join parameters
        $streamingSettings->css_file = 'https://example.com/streaming.css';
        $streamingSettings->join_parameters = "userdata-bbb_hide_nav_bar=true\nuserdata-bbb_show_participants_on_login=false\nuserdata-bbb_show_public_chat_on_login=false";
        $streamingSettings->save();

        $this->assertTrue($this->streamingService->start());

        // Validate request send to streaming service
        $request = Http::recorded()->pop()[0];
        // Validate join url
        $joinUrl = $request->data()['joinUrl'];
        $joinUrlParsed = parse_url($joinUrl);
        parse_str($joinUrlParsed['query'], $joinUrlParams);
        $this->assertEquals('https://example.com/streaming.css', $joinUrlParams['userdata-bbb_custom_style_url']);
        $this->assertEquals('true', $joinUrlParams['userdata-bbb_hide_nav_bar']);
        $this->assertEquals('false', $joinUrlParams['userdata-bbb_show_participants_on_login']);
        $this->assertEquals('false', $joinUrlParams['userdata-bbb_show_public_chat_on_login']);

        // Failed connection
        $this->assertFalse($this->streamingService->start());
    }

    public function test_pause()
    {
        config([
            'streaming.api' => 'https://streaming.example.com',
            'streaming.auth.type' => 'basic',
            'streaming.auth.basic.username' => 'user',
            'streaming.auth.basic.password' => 'password',
        ]);

        $streamingJobHash = hash('sha256', $this->meeting->id.'@bbb.example.com');

        // Mock the streaming service
        Http::preventStrayRequests();
        Http::fake([
            'streaming.example.com/'.$streamingJobHash.'/pause' => Http::sequence()
                ->push([
                    'id' => $streamingJobHash,
                    'progress' => [
                        'status' => 'pausing',
                        'fps' => 25,
                        'bitrate' => 4500,
                    ],
                ])
                ->push([
                    'id' => $streamingJobHash,
                    'progress' => [
                        'status' => 'paused',
                        'fps' => 30,
                        'bitrate' => 4500,
                    ],
                ], 400)
                ->push('Server error', 500)
                ->push('Job not found', 404)
                ->pushFailedConnection(),
        ]);

        // Test status and fps are correctly fetched
        $this->assertTrue($this->streamingService->pause());
        $this->room->streaming->refresh();
        $this->assertEquals('pausing', $this->room->streaming->status);
        $this->assertEquals(25, $this->room->streaming->fps);

        // Test action is not allowed, should update status to new status
        $this->assertTrue($this->streamingService->pause());
        $this->room->streaming->refresh();
        $this->assertEquals('paused', $this->room->streaming->status);
        $this->assertEquals(30, $this->room->streaming->fps);

        // Test server error, should not change status
        $this->assertFalse($this->streamingService->pause());
        $this->room->streaming->refresh();
        $this->assertEquals('paused', $this->room->streaming->status);
        $this->assertEquals(30, $this->room->streaming->fps);

        // Test streaming job not found
        $this->assertTrue($this->streamingService->pause());
        $this->room->streaming->refresh();
        $this->assertNull($this->room->streaming->status);
        $this->assertNull($this->room->streaming->fps);

        // Failed connection
        $this->assertFalse($this->streamingService->pause());
    }

    public function test_resume()
    {
        config([
            'streaming.api' => 'https://streaming.example.com',
            'streaming.auth.type' => 'basic',
            'streaming.auth.basic.username' => 'user',
            'streaming.auth.basic.password' => 'password',
        ]);

        $streamingJobHash = hash('sha256', $this->meeting->id.'@bbb.example.com');

        // Mock the streaming service
        Http::preventStrayRequests();
        Http::fake([
            'streaming.example.com/'.$streamingJobHash.'/resume' => Http::sequence()
                ->push([
                    'id' => $streamingJobHash,
                    'progress' => [
                        'status' => 'resuming',
                        'fps' => 25,
                        'bitrate' => 4500,
                    ],
                ])
                ->push([
                    'id' => $streamingJobHash,
                    'progress' => [
                        'status' => 'running',
                        'fps' => 30,
                        'bitrate' => 4500,
                    ],
                ], 400)
                ->push('Server error', 500)
                ->push('Job not found', 404)
                ->pushFailedConnection(),
        ]);

        // Test status and fps are correctly fetched
        $this->assertTrue($this->streamingService->resume());
        $this->room->streaming->refresh();
        $this->assertEquals('resuming', $this->room->streaming->status);
        $this->assertEquals(25, $this->room->streaming->fps);

        // Test action is not allowed, should update status to new status
        $this->assertTrue($this->streamingService->resume());
        $this->room->streaming->refresh();
        $this->assertEquals('running', $this->room->streaming->status);
        $this->assertEquals(30, $this->room->streaming->fps);

        // Test server error, should not change status
        $this->assertFalse($this->streamingService->resume());
        $this->room->streaming->refresh();
        $this->assertEquals('running', $this->room->streaming->status);
        $this->assertEquals(30, $this->room->streaming->fps);

        // Test streaming job not found
        $this->assertTrue($this->streamingService->resume());
        $this->room->streaming->refresh();
        $this->assertNull($this->room->streaming->status);
        $this->assertNull($this->room->streaming->fps);

        // Failed connection
        $this->assertFalse($this->streamingService->resume());
    }

    public function test_stop()
    {
        config([
            'streaming.api' => 'https://streaming.example.com',
            'streaming.auth.type' => 'basic',
            'streaming.auth.basic.username' => 'user',
            'streaming.auth.basic.password' => 'password',
        ]);

        $streamingJobHash = hash('sha256', $this->meeting->id.'@bbb.example.com');

        // Mock the streaming service
        Http::preventStrayRequests();
        Http::fake([
            'streaming.example.com/'.$streamingJobHash.'/stop' => Http::sequence()
                ->push([
                    'id' => $streamingJobHash,
                    'progress' => [
                        'status' => 'stopping',
                        'fps' => 25,
                        'bitrate' => 4500,
                    ],
                ])
                ->push([
                    'id' => $streamingJobHash,
                    'progress' => [
                        'status' => 'stopped',
                        'fps' => 0,
                        'bitrate' => 0,
                    ],
                ], 400)
                ->push('Server error', 500)
                ->push('Job not found', 404)
                ->pushFailedConnection(),
        ]);

        // Test status and fps are correctly fetched
        $this->assertTrue($this->streamingService->stop());
        $this->room->streaming->refresh();
        $this->assertEquals('stopping', $this->room->streaming->status);
        $this->assertEquals(25, $this->room->streaming->fps);

        // Test action is not allowed, should update status to new status
        $this->assertTrue($this->streamingService->stop());
        $this->room->streaming->refresh();
        $this->assertEquals('stopped', $this->room->streaming->status);
        $this->assertEquals(0, $this->room->streaming->fps);

        // Test server error, should not change status
        $this->assertFalse($this->streamingService->stop());
        $this->room->streaming->refresh();
        $this->assertEquals('stopped', $this->room->streaming->status);
        $this->assertEquals(0, $this->room->streaming->fps);

        // Test streaming job not found
        $this->assertTrue($this->streamingService->stop());
        $this->room->streaming->refresh();
        $this->assertNull($this->room->streaming->status);
        $this->assertNull($this->room->streaming->fps);

        // Failed connection
        $this->assertFalse($this->streamingService->stop());
    }
}
