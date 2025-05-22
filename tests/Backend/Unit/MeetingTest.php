<?php

namespace Tests\Backend\Unit;

use App\Enums\RoomUserRole;
use App\Http\Requests\JoinMeeting;
use App\Models\Meeting;
use App\Models\Room;
use App\Models\RoomFile;
use App\Models\RoomToken;
use App\Models\Server;
use App\Models\User;
use App\Services\MeetingService;
use App\Services\RoomAuthService;
use App\Services\ServerService;
use Http;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Str;
use Tests\Backend\TestCase;
use TiMacDonald\Log\LogEntry;
use TiMacDonald\Log\LogFake;

class MeetingTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private $meeting;

    protected function setUp(): void
    {
        parent::setUp();

        // Create room and meeting
        $room = Room::factory()->create(['access_code' => 123456789]);
        $this->meeting = new Meeting;
        $this->meeting->room()->associate($room);
        $this->meeting->save();
    }

    /**
     * Test some default parameters for room start
     */
    public function test_start_parameters()
    {
        $meeting = $this->meeting;

        Http::fake([
            'test.notld/bigbluebutton/api/create*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/Success.xml')),
        ]);

        $server = Server::factory()->create();
        $meeting->server()->associate($server);

        $serverService = new ServerService($server);

        $meetingService = new MeetingService($meeting);
        $meetingService->setServerService($serverService)->start();

        $request = Http::recorded()[0][0];
        $data = $request->data();

        $this->assertEquals($meeting->id, $data['meetingID']);
        $this->assertEquals($meeting->room->name, $data['name']);
        $this->assertEquals(url('rooms/'.$meeting->room->id), $data['logoutURL']);

        $this->assertStringContainsString($meeting->room->name, $data['moderatorOnlyMessage']);
        $this->assertStringContainsString('http://localhost/rooms/'.$meeting->room->id, $data['moderatorOnlyMessage']);
        $this->assertStringContainsString('123-456-789', $data['moderatorOnlyMessage']);

        $salt = urldecode(explode('?salt=', $data['meta_endCallbackUrl'])[1]);
        $this->assertTrue((new MeetingService($meeting))->validateCallbackSalt($salt));
        $this->assertArrayNotHasKey('logo', $data);
    }

    /**
     * Test some default parameters for room start
     */
    public function test_start_with_custom_create_parameters()
    {
        LogFake::bind();

        $meeting = $this->meeting;

        $room = $this->meeting->room;
        $room->auto_start_recording = true;
        $room->save();

        $roomType = $room->roomType;
        $roomType->max_duration = 60;
        $roomType->create_parameters = "autoStartRecording=false\nduration=10\nmeetingLayout=PRESENTATION_FOCUS\nmeta_category=FINANCE\ndisabledFeatures=learningDashboard,virtualBackgrounds";
        $roomType->save();

        Http::fake([
            'test.notld/bigbluebutton/api/create*' => Http::sequence()
                ->push(file_get_contents(__DIR__.'/../Fixtures/Success.xml'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/Success.xml'))
                ->push(file_get_contents(__DIR__.'/../Fixtures/Success.xml')),
        ]);

        $server = Server::factory()->create();
        $meeting->server()->associate($server);

        $serverService = new ServerService($server);

        $meetingService = new MeetingService($meeting);
        $meetingService->setServerService($serverService)->start();

        $request = Http::recorded()[0][0];
        $data = $request->data();

        // Check if custom parameters are set
        $this->assertEquals('PRESENTATION_FOCUS', $data['meetingLayout']);
        $this->assertEquals('FINANCE', $data['meta_category']);
        $this->assertEquals('learningDashboard,virtualBackgrounds', $data['disabledFeatures']);

        // Check if parameters of the room and room type are not overwritten
        $this->assertEquals('60', $data['duration']);
        $this->assertEquals('true', $data['autoStartRecording']);

        // Check if nothing was logged
        Log::assertNothingLogged();

        // Check with invalid create parameters
        $roomType->create_parameters = "meta_foo=baa\nrecord=invalid\nmaxParticipants=10.5\nmeetingLayout=invalid\ndisabledFeatures=learningDashboard,invalid";
        $roomType->save();

        $meetingService->start();

        $request = Http::recorded()[1][0];
        $data = $request->data();

        // Check if invalid parameters are not set
        $this->assertArrayNotHasKey('maxParticipants', $data);
        $this->assertArrayNotHasKey('meetingLayout', $data);
        $this->assertArrayNotHasKey('record', $data);
        $this->assertArrayNotHasKey('disabledFeatures', $data);

        // Check if valid parameters are also not set, as all create parameters are discarded if one is invalid
        $this->assertArrayNotHasKey('meta_foo', $data);

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom create parameter {parameter} value {value} is not a boolean'
                && $log->context['parameter'] == 'record'
                && $log->context['value'] == 'invalid'
        );

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom create parameter {parameter} value {value} is not an integer'
                && $log->context['parameter'] == 'maxParticipants'
                && $log->context['value'] == '10.5'
        );

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom create parameter {parameter} value {value} is not an enum value'
                && $log->context['parameter'] == 'meetingLayout'
                && $log->context['value'] == 'invalid'
        );

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom create parameter {parameter} value {value} is not an enum value'
                && $log->context['parameter'] == 'disabledFeatures'
                && $log->context['value'][0] == 'learningDashboard'
                && $log->context['value'][1] == 'invalid'
        );
    }

    /**
     * Test room start with global logo
     */
    public function test_start_parameters_with_logo()
    {
        $this->bigBlueButtonSettings->logo = url('logo.png');
        $this->bigBlueButtonSettings->save();

        $meeting = $this->meeting;

        Http::fake([
            'test.notld/bigbluebutton/api/create*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/Success.xml')),
        ]);

        $server = Server::factory()->create();
        $meeting->server()->associate($server);

        $serverService = new ServerService($server);

        $meetingService = new MeetingService($meeting);
        $meetingService->setServerService($serverService)->start();

        $request = Http::recorded()[0][0];
        $data = $request->data();

        // Check content type of body
        $this->assertEquals('application/xml', $request->header('Content-Type')[0]);

        $this->assertEquals(url('logo.png'), $data['logo']);

        // Check dark logo missing
        $this->assertArrayNotHasKey('darklogo', $data);

        // Add dark logo
        $this->bigBlueButtonSettings->logo_dark = url('logo_dark.png');
        $this->bigBlueButtonSettings->save();

        $meetingService->setServerService($serverService)->start();

        $request = Http::recorded()[1][0];
        $data = $request->data();

        // Check logo and dark logo
        $this->assertEquals(url('logo.png'), $data['logo']);
        $this->assertEquals(url('logo_dark.png'), $data['darklogo']);

    }

    /**
     * Test room start with own presentations
     */
    public function test_start_parameters_with_own_presentation()
    {
        $meeting = $this->meeting;

        $this->bigBlueButtonSettings->default_presentation = url('default.pdf');
        $this->bigBlueButtonSettings->save();

        Http::fake([
            'test.notld/bigbluebutton/api/create*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/Success.xml')),
        ]);

        Storage::fake('local');

        $file1 = new RoomFile;
        $file1->path = UploadedFile::fake()->image('file1.pdf')->store($meeting->room->id);
        $file1->filename = 'file1';
        $file1->use_in_meeting = true;
        $meeting->room->files()->save($file1);

        $file2 = new RoomFile;
        $file2->path = UploadedFile::fake()->image('file2.pdf')->store($meeting->room->id);
        $file2->filename = 'file2';
        $file2->use_in_meeting = true;
        $file2->default = true;
        $meeting->room->files()->save($file2);

        $file3 = new RoomFile;
        $file3->path = UploadedFile::fake()->image('file3.pdf')->store($meeting->room->id);
        $file3->filename = 'file3';
        $file3->use_in_meeting = true;
        $meeting->room->files()->save($file3);

        $file4 = new RoomFile;
        $file4->path = UploadedFile::fake()->image('file4.pdf')->store($meeting->room->id);
        $file4->filename = 'file4';
        $file4->use_in_meeting = false;
        $meeting->room->files()->save($file4);

        $server = Server::factory()->create();
        $meeting->server()->associate($server);

        $serverService = new ServerService($server);

        $meetingService = new MeetingService($meeting);
        $meetingService->setServerService($serverService)->start();

        $request = Http::recorded()[0][0];
        $body = $request->body();
        $xml = simplexml_load_string($body);
        $docs = $xml->module->document;

        $this->assertCount(3, $docs);

        // Check content type of body
        $this->assertEquals('application/xml', $request->header('Content-Type')[0]);

        // check order based on default and missing file 4 because use_in_meeting disabled
        $this->assertEquals('file2', $docs[0]->attributes()->filename);
        $this->assertEquals('file1', $docs[1]->attributes()->filename);
        $this->assertEquals('file3', $docs[2]->attributes()->filename);
    }

    /**
     * Test room start without own presentations but global presentation
     */
    public function test_start_parameters_without_own_presentation()
    {
        $meeting = $this->meeting;

        $this->bigBlueButtonSettings->default_presentation = url('default.pdf');
        $this->bigBlueButtonSettings->save();

        Http::fake([
            'test.notld/bigbluebutton/api/create*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/Success.xml')),
        ]);

        $server = Server::factory()->create();
        $meeting->server()->associate($server);

        $serverService = new ServerService($server);

        $meetingService = new MeetingService($meeting);
        $meetingService->setServerService($serverService)->start();

        $request = Http::recorded()[0][0];
        $body = $request->body();
        $xml = simplexml_load_string($body);
        $docs = $xml->module->document;

        $this->assertCount(1, $docs);

        // check order based on default and missing file 4 because use_in_meeting disabled
        $this->assertEquals(url('default.pdf'), $docs[0]->attributes()->url);
    }

    public function test_join_parameters_authenticated_user()
    {
        $meeting = $this->meeting;
        $user = User::factory()->create();
        $user->refresh();

        Http::fake([
            'test.notld/bigbluebutton/api/create*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/Success.xml')),
        ]);

        $server = Server::factory()->create();
        $meeting->server()->associate($server);

        $serverService = new ServerService($server);
        $meetingService = new MeetingService($meeting);
        $roomAuthService = app()->make(RoomAuthService::class);
        $roomAuthService->setAuthenticated($meeting->room, true);
        \Auth::login($user);

        $request = new JoinMeeting($roomAuthService);
        $parameters = [];
        parse_str(parse_url($meetingService->setServerService($serverService)->getJoinUrl($request), PHP_URL_QUERY), $parameters);

        $this->assertEquals('u'.$user->id, $parameters['userID']);
        $this->assertEquals($user->fullname, $parameters['fullName']);
        $this->assertEquals($meeting->id, $parameters['meetingID']);
        $this->assertEquals('VIEWER', $parameters['role']);
        $this->assertEquals('true', $parameters['redirect']);
        $this->assertEquals(url('rooms/'.$this->meeting->room->id), $parameters['errorRedirectUrl']);
        $this->assertEquals('false', $parameters['userdata-bbb_skip_check_audio']);

        // Change skip check audio
        $user->bbb_skip_check_audio = true;
        $user->save();

        $parameters = [];
        parse_str(parse_url($meetingService->setServerService($serverService)->getJoinUrl($request), PHP_URL_QUERY), $parameters);

        $this->assertEquals('true', $parameters['userdata-bbb_skip_check_audio']);

        // Change default role of the room, user should be moderator
        $room = $this->meeting->room;
        $room->expert_mode = true;
        $room->default_role = RoomUserRole::MODERATOR;
        $room->save();
        $parameters = [];
        parse_str(parse_url($meetingService->setServerService($serverService)->getJoinUrl($request), PHP_URL_QUERY), $parameters);
        $this->assertEquals('MODERATOR', $parameters['role']);

        // Change default role of the room back to user
        $room->default_role = RoomUserRole::USER;
        $room->save();

        // Change role of the user to moderator
        $meeting->room->members()->sync([$user->id => ['role' => RoomUserRole::MODERATOR]]);
        $parameters = [];
        parse_str(parse_url($meetingService->setServerService($serverService)->getJoinUrl($request), PHP_URL_QUERY), $parameters);
        $this->assertEquals('MODERATOR', $parameters['role']);

        // Change role of the user to viewer
        $meeting->room->members()->sync([$user->id => ['role' => RoomUserRole::USER]]);
        $parameters = [];
        parse_str(parse_url($meetingService->setServerService($serverService)->getJoinUrl($request), PHP_URL_QUERY), $parameters);
        $this->assertEquals('VIEWER', $parameters['role']);

        // Change role of the user to Co-Owner
        $meeting->room->members()->sync([$user->id => ['role' => RoomUserRole::CO_OWNER]]);
        $parameters = [];
        parse_str(parse_url($meetingService->setServerService($serverService)->getJoinUrl($request), PHP_URL_QUERY), $parameters);
        $this->assertEquals('MODERATOR', $parameters['role']);

        // Test owner
        \Auth::login($meeting->room->owner);
        $parameters = [];
        parse_str(parse_url($meetingService->setServerService($serverService)->getJoinUrl($request), PHP_URL_QUERY), $parameters);
        $this->assertEquals('MODERATOR', $parameters['role']);
    }

    public function test_join_parameters_guest()
    {
        $meeting = $this->meeting;

        Http::fake([
            'test.notld/bigbluebutton/api/create*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/Success.xml')),
        ]);

        $server = Server::factory()->create();
        $meeting->server()->associate($server);

        $serverService = new ServerService($server);
        $meetingService = new MeetingService($meeting);
        $roomAuthService = app()->make(RoomAuthService::class);
        $roomAuthService->setAuthenticated($meeting->room, false);

        $request = new JoinMeeting($roomAuthService);
        $request->replace([
            'name' => 'John Doe',
        ]);

        $parameters = [];
        parse_str(parse_url($meetingService->setServerService($serverService)->getJoinUrl($request), PHP_URL_QUERY), $parameters);

        $this->assertEquals('s'.session()->getId(), $parameters['userID']);
        $this->assertEquals('John Doe', $parameters['fullName']);
        $this->assertEquals(true, $parameters['guest']);
        $this->assertEquals('VIEWER', $parameters['role']);

        // Change default role of the room, moderator role should not be set for guest users
        $room = $this->meeting->room;
        $room->expert_mode = true;
        $room->default_role = RoomUserRole::MODERATOR;
        $room->save();
        $parameters = [];
        parse_str(parse_url($meetingService->setServerService($serverService)->getJoinUrl($request), PHP_URL_QUERY), $parameters);
        $this->assertEquals('VIEWER', $parameters['role']);
    }

    public function test_join_parameters_guest_with_token()
    {
        $meeting = $this->meeting;

        Http::fake([
            'test.notld/bigbluebutton/api/create*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/Success.xml')),
        ]);

        $server = Server::factory()->create();
        $meeting->server()->associate($server);

        $token = new RoomToken;
        $token->room()->associate($meeting->room);
        $token->firstname = 'John';
        $token->lastname = 'Doe';
        $token->role = RoomUserRole::USER;
        $token->token = Str::random(10);
        $token->save();

        $serverService = new ServerService($server);
        $meetingService = new MeetingService($meeting);
        $roomAuthService = app()->make(RoomAuthService::class);
        $roomAuthService->setAuthenticated($meeting->room, false);
        $roomAuthService->setRoomToken($meeting->room, $token);

        $request = new JoinMeeting($roomAuthService);

        $parameters = [];
        parse_str(parse_url($meetingService->setServerService($serverService)->getJoinUrl($request), PHP_URL_QUERY), $parameters);

        $this->assertEquals('s'.session()->getId(), $parameters['userID']);
        $this->assertEquals('John Doe', $parameters['fullName']);
        $this->assertArrayNotHasKey('guest', $parameters);
        $this->assertEquals('VIEWER', $parameters['role']);

        // Change default role of the room, moderator role should not be set as the role of the token has priority
        $room = $this->meeting->room;
        $room->expert_mode = true;
        $room->default_role = RoomUserRole::MODERATOR;
        $room->save();
        $parameters = [];
        parse_str(parse_url($meetingService->setServerService($serverService)->getJoinUrl($request), PHP_URL_QUERY), $parameters);
        $this->assertEquals('VIEWER', $parameters['role']);

        // Change role of the token to moderator
        $token->role = RoomUserRole::MODERATOR;
        $token->save();

        $parameters = [];
        parse_str(parse_url($meetingService->setServerService($serverService)->getJoinUrl($request), PHP_URL_QUERY), $parameters);
        $this->assertEquals('MODERATOR', $parameters['role']);
    }

    public function test_join_parameters_with_custom_join_parameters()
    {
        LogFake::bind();
        $meeting = $this->meeting;

        Http::fake([
            'test.notld/bigbluebutton/api/create*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/Success.xml')),
        ]);

        $server = Server::factory()->create();
        $meeting->server()->associate($server);

        $serverService = new ServerService($server);
        $meetingService = new MeetingService($meeting);
        $roomAuthService = app()->make(RoomAuthService::class);
        $roomAuthService->setAuthenticated($meeting->room, false);

        \Auth::login($meeting->room->owner);

        // Check with valid join parameters
        $roomType = $this->meeting->room->roomType;
        $roomType->join_parameters = "enforceLayout=PRESENTATION_ONLY\nwebcamBackgroundURL=https://example.com/background.png\nexcludeFromDashboard=true\nredirect=false\nuserdata-bbb_hide_presentation_on_join=true";
        $roomType->save();
        $request = new JoinMeeting($roomAuthService);
        $parameters = [];
        parse_str(parse_url($meetingService->setServerService($serverService)->getJoinUrl($request), PHP_URL_QUERY), $parameters);

        // Check if custom parameters are set
        $this->assertEquals('PRESENTATION_ONLY', $parameters['enforceLayout']);
        $this->assertEquals('https://example.com/background.png', $parameters['webcamBackgroundURL']);
        $this->assertEquals('true', $parameters['excludeFromDashboard']);
        $this->assertEquals('true', $parameters['userdata-bbb_hide_presentation_on_join']);

        // Check if parameters of the room and room type are not overwritten
        $this->assertEquals('true', $parameters['redirect']);

        // Check if nothing was logged
        Log::assertNothingLogged();

        // Check with invalid create parameters
        $roomType->join_parameters = "enforceLayout=INVALID_LAYOUT\nexcludeFromDashboard=invalid\nuserdata-bbb_hide_presentation_on_join=true";
        $roomType->save();

        $request = new JoinMeeting($roomAuthService);
        $parameters = [];
        parse_str(parse_url($meetingService->setServerService($serverService)->getJoinUrl($request), PHP_URL_QUERY), $parameters);

        // Check if invalid parameters are not set
        $this->assertArrayNotHasKey('excludeFromDashboard', $parameters);
        $this->assertArrayNotHasKey('enforceLayout', $parameters);

        // Check if valid parameters are also not set, as all create parameters are discarded if one is invalid
        $this->assertArrayNotHasKey('userdata-bbb_hide_presentation_on_join', $parameters);

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom join parameter {parameter} value {value} is not a boolean'
                && $log->context['parameter'] == 'excludeFromDashboard'
                && $log->context['value'] == 'invalid'
        );

        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom join parameter {parameter} value {value} is not an enum value'
                && $log->context['parameter'] == 'enforceLayout'
                && $log->context['value'] == 'INVALID_LAYOUT'
        );
    }
}
