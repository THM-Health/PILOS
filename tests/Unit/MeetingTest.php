<?php

namespace Tests\Unit;

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
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

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
     * Test room start with global logo
     */
    public function testStartParametersWithLogo()
    {
        setting()->set('bbb_logo', url('logo.png'));

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

        setting()->set('default_presentation', url('default.pdf'));

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

        setting()->set('default_presentation', url('default.pdf'));

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
