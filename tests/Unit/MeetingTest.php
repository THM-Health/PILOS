<?php

namespace Tests\Unit;

use App\Enums\RecordingMode;
use App\Models\Meeting;
use App\Models\Room;
use App\Models\RoomFile;
use App\Models\Server;
use App\Services\MeetingService;
use App\Services\ServerService;
use Carbon\Carbon;
use Http;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use TiMacDonald\Log\LogEntry;
use TiMacDonald\Log\LogFake;

class MeetingTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private $meeting;

    public function setUp(): void
    {
        parent::setUp();

        // Create room and meeting
        $room = Room::factory()->create(['access_code' => 123456789]);
        $this->meeting = new Meeting();
        $this->meeting->room()->associate($room);
        $this->meeting->save();
    }

    /**
     * Test some default parameters for room start
     */
    public function testStartParameters()
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
    public function testStartWithCustomCreateParameters()
    {
        Log::swap(new LogFake);

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
        $roomType->create_parameters = "autoStartRecording\ninvalidParameter=10\n";
        $roomType->save();

        $meetingService->start();

        $request = Http::recorded()[1][0];
        $data = $request->data();

        // Check if invalid parameters are not set
        $this->assertArrayNotHasKey('invalidParameter', $data);

        // Check if parameters of the room and room type are not overwritten
        $this->assertEquals('true', $data['autoStartRecording']);

        // Check if parameter with no value is logged
        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom create parameter for {parameter} has no value'
                && $log->context['parameter'] == 'autoStartRecording'
        );

        // Check if invalid parameter is logged
        Log::assertLogged(
            fn (LogEntry $log) => $log->level == 'warning'
                && $log->message == 'Custom create parameter for {parameter} can not be found'
                && $log->context['parameter'] == 'invalidParameter'
        );
    }

    /**
     * Test room start with global logo
     */
    public function testStartParametersWithLogo()
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
    }

    /**
     * Test room start with own presentations
     */
    public function testStartParametersWithOwnPresentation()
    {
        $meeting = $this->meeting;

        $this->bigBlueButtonSettings->default_presentation = url('default.pdf');
        $this->bigBlueButtonSettings->save();

        Http::fake([
            'test.notld/bigbluebutton/api/create*' => Http::response(file_get_contents(__DIR__.'/../Fixtures/Success.xml')),
        ]);

        Storage::fake('local');

        $file1 = new RoomFile();
        $file1->path = UploadedFile::fake()->image('file1.pdf')->store($meeting->room->id);
        $file1->filename = 'file1';
        $file1->use_in_meeting = true;
        $meeting->room->files()->save($file1);

        $file2 = new RoomFile();
        $file2->path = UploadedFile::fake()->image('file2.pdf')->store($meeting->room->id);
        $file2->filename = 'file2';
        $file2->use_in_meeting = true;
        $file2->default = true;
        $meeting->room->files()->save($file2);

        $file3 = new RoomFile();
        $file3->path = UploadedFile::fake()->image('file3.pdf')->store($meeting->room->id);
        $file3->filename = 'file3';
        $file3->use_in_meeting = true;
        $meeting->room->files()->save($file3);

        $file4 = new RoomFile();
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
    public function testStartParametersWithoutOwnPresentation()
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

    /**
     * Test if the OpenCast plugin is not used with the integrated recording mode
     *
     * @return void
     */
    public function testStartWithoutOpenCastPlugin()
    {
        config(['recording.mode' => RecordingMode::INTEGRATED]);

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

        $this->assertArrayNotHasKey('meta_opencast-dc-title', $data);
    }

    /**
     * Test if the OpenCast plugin is used with the OpenCast recording mode
     * and the default metadata is sent
     *
     * @return void
     */
    public function testStartWithDefaultOpenCastPlugin()
    {
        config(['recording.mode' => RecordingMode::OPENCAST]);
        config(['app.locale' => 'fr']);
        $this->travelTo(Carbon::create(2023, 9, 28, 12, 01, 00));

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

        $this->assertEquals('2023-09-28 - '.$meeting->room->name, $data['meta_opencast-dc-title']);
        $this->assertEquals($meeting->room->owner->external_id, $data['meta_opencast-dc-creator']);
        $this->assertEquals('2023-09-28T12:01:00Z', $data['meta_opencast-dc-created']);
        $this->assertEquals('fr', $data['meta_opencast-dc-language']);
        $this->assertEquals($meeting->room->owner->external_id, $data['meta_opencast-dc-rightsHolder']);
        $this->assertEquals($meeting->room->id, $data['meta_opencast-dc-isPartOf']);
        $this->assertEquals($meeting->room->owner->external_id, $data['meta_opencast-acl-user-id']);
        $this->assertEquals($meeting->room->owner->external_id, $data['meta_opencast-series-acl-user-id']);
        $this->assertEquals($meeting->room->name, $data['meta_opencast-series-dc-title']);
    }

    /**
     * Test if the OpenCast plugin is used with the OpenCast recording mode
     * and a custom plugin
     *
     * @return void
     */
    public function testStartWithCustomOpenCastPlugin()
    {
        config(['recording.mode' => RecordingMode::OPENCAST]);
        config(['app.locale' => 'fr']);

        // Register custom OpenCast plugin
        config([
            'plugins.enabled' => ['OpenCastRecordingPlugin'],
            'plugins.namespaces.custom' => 'Tests\Utils',
        ]);

        $this->travelTo(Carbon::create(2023, 9, 28, 12, 01, 00));

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

        $this->assertEquals($meeting->room->name, $data['meta_opencast-dc-title']);
        $this->assertEquals($meeting->id, $data['meta_opencast-dc-identifier']);
        $this->assertEquals($meeting->room->owner->external_id, $data['meta_opencast-dc-creator']);
        $this->assertEquals('2023-09-28T12:01:00Z', $data['meta_opencast-dc-created']);
        $this->assertEquals('DE', $data['meta_opencast-dc-language']);
    }
}
