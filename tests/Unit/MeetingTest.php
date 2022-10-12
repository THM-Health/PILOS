<?php

namespace Tests\Unit;

use App\Models\Meeting;
use App\Models\Room;
use App\Models\RoomFile;
use App\Models\Server;
use App\Services\MeetingService;
use App\Services\ServerService;
use BigBlueButton\BigBlueButton;
use BigBlueButton\Parameters\CreateMeetingParameters;
use BigBlueButton\Responses\CreateMeetingResponse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

class MeetingTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private $meeting;

    public function setUp(): void
    {
        parent::setUp();

        // Create room and meeting
        $room                              = Room::factory()->create();
        $this->meeting                     = new Meeting();
        $this->meeting->attendee_pw        = bin2hex(random_bytes(5));
        $this->meeting->moderator_pw       = bin2hex(random_bytes(5));
        $this->meeting->room()->associate($room);
        $this->meeting->save();
    }

    /**
     * Test some default parameters for room start
     */
    public function testStartParameters()
    {
        $meeting  = $this->meeting;
        $response = new CreateMeetingResponse(new \SimpleXMLElement('<response><returncode>SUCCESS</returncode></response>'));
        $bbbMock  = Mockery::mock(BigBlueButton::class, function ($mock) use ($response, $meeting) {
            $mock->shouldReceive('createMeeting')->withArgs(function (CreateMeetingParameters $arg) use ($response, $meeting) {
                $this->assertEquals($meeting->id, $arg->getMeetingID());
                $this->assertEquals($meeting->room->name, $arg->getName());
                $this->assertEquals($meeting->moderator_pw, $arg->getModeratorPW());
                $this->assertEquals($meeting->attendee_pw, $arg->getAttendeePW());
                $this->assertEquals(url('rooms/'.$meeting->room->id), $arg->getLogoutUrl());

                $salt = urldecode(explode('?salt=', $arg->getMeta('endCallbackUrl'))[1]);
                $this->assertTrue((new MeetingService($meeting))->validateCallbackSalt($salt));
                $this->assertCount(0, $arg->getPresentations());
                $this->assertNull($arg->getLogo());

                return true;
            })->once()->andReturn($response);
        });
        $server = Server::factory()->create();
        $meeting->server()->associate($server);

        $serverService = new ServerService($server);
        $serverService->setBigBlueButton($bbbMock);

        $meetingService = new MeetingService($meeting);
        $meetingService->setServerService($serverService)->start();
    }

    /**
     * Test room start with gloabl logo
     */
    public function testStartParametersWithLogo()
    {
        setting()->set('bbb_logo', url('logo.png'));

        $meeting  = $this->meeting;
        $response = new CreateMeetingResponse(new \SimpleXMLElement('<response><returncode>SUCCESS</returncode></response>'));
        $bbbMock  = Mockery::mock(BigBlueButton::class, function ($mock) use ($response, $meeting) {
            $mock->shouldReceive('createMeeting')->withArgs(function (CreateMeetingParameters $arg) use ($meeting) {
                $this->assertEquals( url('logo.png'), $arg->getLogo());

                return true;
            })->once()->andReturn($response);
        });
        $server = Server::factory()->create();
        $meeting->server()->associate($server);

        $serverService = new ServerService($server);
        $serverService->setBigBlueButton($bbbMock);

        $meetingService = new MeetingService($meeting);
        $meetingService->setServerService($serverService)->start();
    }

    /**
     * Test room start with own presentations
     */
    public function testStartParametersWithOwnPresentation()
    {
        $meeting = $this->meeting;

        setting()->set('default_presentation', url('default.pdf'));

        Storage::fake('local');

        $file1                 = new RoomFile();
        $file1->path           = UploadedFile::fake()->image('file1.pdf')->store($meeting->room->id);
        $file1->filename       = 'file1';
        $file1->use_in_meeting = true;
        $meeting->room->files()->save($file1);

        $file2                 = new RoomFile();
        $file2->path           = UploadedFile::fake()->image('file2.pdf')->store($meeting->room->id);
        $file2->filename       = 'file2';
        $file2->use_in_meeting = true;
        $file2->default        = true;
        $meeting->room->files()->save($file2);

        $file3                 = new RoomFile();
        $file3->path           = UploadedFile::fake()->image('file3.pdf')->store($meeting->room->id);
        $file3->filename       = 'file3';
        $file3->use_in_meeting = true;
        $meeting->room->files()->save($file3);

        $file4                 = new RoomFile();
        $file4->path           = UploadedFile::fake()->image('file4.pdf')->store($meeting->room->id);
        $file4->filename       = 'file4';
        $file4->use_in_meeting = false;
        $meeting->room->files()->save($file4);
        $response = new CreateMeetingResponse(new \SimpleXMLElement('<response><returncode>SUCCESS</returncode></response>'));
        $bbbMock  = Mockery::mock(BigBlueButton::class, function ($mock) use ($response, $meeting) {
            $mock->shouldReceive('createMeeting')->withArgs(function (CreateMeetingParameters $arg) use ($meeting) {
                $this->assertCount(3, $arg->getPresentations());
                $fileNames = array_values($arg->getPresentations());
                // check order based on default and missing file 4 because use_in_meeting disabled
                $this->assertEquals('file2', $fileNames[0]);
                $this->assertEquals('file1', $fileNames[1]);
                $this->assertEquals('file3', $fileNames[2]);

                return true;
            })->once()->andReturn($response);
        });
        $server = Server::factory()->create();
        $meeting->server()->associate($server);

        $serverService = new ServerService($server);
        $serverService->setBigBlueButton($bbbMock);

        $meetingService = new MeetingService($meeting);
        $meetingService->setServerService($serverService)->start();
    }

    /**
     * Test room start without own presentations but global presentation
     */
    public function testStartParametersWithoutOwnPresentation()
    {
        $meeting = $this->meeting;

        setting()->set('default_presentation', url('default.pdf'));
        $response = new CreateMeetingResponse(new \SimpleXMLElement('<response><returncode>SUCCESS</returncode></response>'));
        $bbbMock  = Mockery::mock(BigBlueButton::class, function ($mock) use ($response, $meeting) {
            $mock->shouldReceive('createMeeting')->withArgs(function (CreateMeetingParameters $arg) use ($meeting) {
                $this->assertCount(1, $arg->getPresentations());
                $this->assertEquals(url('default.pdf'), array_keys($arg->getPresentations())[0]);

                return true;
            })->once()->andReturn($response);
        });
        $server = Server::factory()->create();
        $meeting->server()->associate($server);

        $serverService = new ServerService($server);
        $serverService->setBigBlueButton($bbbMock);

        $meetingService = new MeetingService($meeting);
        $meetingService->setServerService($serverService)->start();
    }
}
