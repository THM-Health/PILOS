<?php

namespace Tests\Backend\Unit;

use App\Models\Meeting;
use App\Models\Room;
use App\Models\RoomFile;
use App\Models\Server;
use App\Services\MeetingService;
use App\Services\ServerService;
use Http;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
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
}
