<?php

namespace Tests\Unit;

use App\Meeting;
use App\Room;
use App\RoomFile;
use App\Server;
use BigBlueButton\BigBlueButton;
use BigBlueButton\Parameters\CreateMeetingParameters;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
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
        $room                             = Room::factory()->create();
        $this->meeting                    = new Meeting();
        $this->meeting->attendeePW        = bin2hex(random_bytes(5));
        $this->meeting->moderatorPW       = bin2hex(random_bytes(5));
        $this->meeting->room()->associate($room);
        $this->meeting->save();
    }

    /**
     * Test some default parameters for room start
     */
    public function testStartParameters()
    {
        $meeting = $this->meeting;
        $bbbMock = Mockery::mock(BigBlueButton::class, function ($mock) use ($meeting) {
            $mock->shouldReceive('createMeeting')->withArgs(function (CreateMeetingParameters $arg) use ($meeting) {
                $this->assertEquals($meeting->id, $arg->getMeetingID());
                $this->assertEquals($meeting->room->name, $arg->getName());
                $this->assertEquals($meeting->moderatorPW, $arg->getModeratorPW());
                $this->assertEquals($meeting->attendeePW, $arg->getAttendeePW());
                $this->assertEquals(url('rooms/'.$meeting->room->id), $arg->getLogoutUrl());

                $salt = urldecode(explode('?salt=', $arg->getMeta('endCallbackUrl'))[1]);
                $this->assertTrue(Hash::check($meeting->getCallbackSalt(), $salt));
                $this->assertCount(0, $arg->getPresentations());
                $this->assertNull($arg->getLogo());

                return true;
            })->once();
        });
        $server = Server::factory()->create();
        $server->setBBB($bbbMock);
        $meeting->server()->associate($server);
        $meeting->startMeeting();
    }

    /**
     * Test room start with gloabl logo
     */
    public function testStartParametersWithLogo()
    {
        setting()->set('bbb_logo', url('logo.png'));

        $meeting = $this->meeting;
        $bbbMock = Mockery::mock(BigBlueButton::class, function ($mock) use ($meeting) {
            $mock->shouldReceive('createMeeting')->withArgs(function (CreateMeetingParameters $arg) use ($meeting) {
                $this->assertEquals( url('logo.png'), $arg->getLogo());

                return true;
            })->once();
        });
        $server = Server::factory()->create();
        $server->setBBB($bbbMock);
        $meeting->server()->associate($server);
        $meeting->startMeeting();
    }

    /**
     * Test room start with own presentations
     */
    public function testStartParametersWithOwnPresentation()
    {
        $meeting = $this->meeting;

        setting()->set('default_presentation', url('default.pdf'));

        Storage::fake('local');

        $file1               = new RoomFile();
        $file1->path         = UploadedFile::fake()->image('file1.pdf')->store($meeting->room->id);
        $file1->filename     = 'file1';
        $file1->useinmeeting = true;
        $meeting->room->files()->save($file1);

        $file2               = new RoomFile();
        $file2->path         = UploadedFile::fake()->image('file2.pdf')->store($meeting->room->id);
        $file2->filename     = 'file2';
        $file2->useinmeeting = true;
        $file2->default      = true;
        $meeting->room->files()->save($file2);

        $file3               = new RoomFile();
        $file3->path         = UploadedFile::fake()->image('file3.pdf')->store($meeting->room->id);
        $file3->filename     = 'file3';
        $file3->useinmeeting = true;
        $meeting->room->files()->save($file3);

        $file4               = new RoomFile();
        $file4->path         = UploadedFile::fake()->image('file4.pdf')->store($meeting->room->id);
        $file4->filename     = 'file4';
        $file4->useinmeeting = false;
        $meeting->room->files()->save($file4);

        $bbbMock = Mockery::mock(BigBlueButton::class, function ($mock) use ($meeting) {
            $mock->shouldReceive('createMeeting')->withArgs(function (CreateMeetingParameters $arg) use ($meeting) {
                $this->assertCount(3, $arg->getPresentations());
                $fileNames = array_values($arg->getPresentations());
                // check order based on default and missing file 4 because useinmeeting disabled
                $this->assertEquals('file2', $fileNames[0]);
                $this->assertEquals('file1', $fileNames[1]);
                $this->assertEquals('file3', $fileNames[2]);

                return true;
            })->once();
        });
        $server = Server::factory()->create();
        $server->setBBB($bbbMock);
        $meeting->server()->associate($server);
        $meeting->startMeeting();
    }

    /**
     * Test room start without own presentations but global presentation
     */
    public function testStartParametersWithoutOwnPresentation()
    {
        $meeting = $this->meeting;

        setting()->set('default_presentation', url('default.pdf'));

        $bbbMock = Mockery::mock(BigBlueButton::class, function ($mock) use ($meeting) {
            $mock->shouldReceive('createMeeting')->withArgs(function (CreateMeetingParameters $arg) use ($meeting) {
                $this->assertCount(1, $arg->getPresentations());
                $this->assertEquals(url('default.pdf'), array_keys($arg->getPresentations())[0]);

                return true;
            })->once();
        });
        $server = Server::factory()->create();
        $server->setBBB($bbbMock);
        $meeting->server()->associate($server);
        $meeting->startMeeting();
    }
}
