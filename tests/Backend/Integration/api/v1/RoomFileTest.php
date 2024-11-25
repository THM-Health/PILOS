<?php

namespace Tests\Backend\Integration\api\v1;

use App\Models\Room;
use App\Services\BigBlueButton\LaravelHTTPClient;
use App\Services\MeetingService;
use Database\Seeders\ServerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Backend\TestCase;

class RoomFileTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Testing to start a meeting with a file on a BBB-Server
     */
    public function test_start_meeting_with_file()
    {
        Storage::fake('local');
        $room = Room::factory()->create();
        $validFile = UploadedFile::fake()->create('document.pdf', config('bigbluebutton.max_filesize') * 1000 - 1, 'application/pdf');

        $this->actingAs($room->owner)->postJson(route('api.v1.rooms.files.add', ['room' => $room]), ['file' => $validFile])
            ->assertSuccessful();

        $file = $room->files->first();

        $this->actingAs($room->owner)->putJson(route('api.v1.rooms.files.update', ['room' => $room, 'file' => $file]), ['download' => false, 'default' => false, 'use_in_meeting' => true])
            ->assertSuccessful();

        // Adding server(s)
        $this->seed(ServerSeeder::class);

        // Create server
        $response = $this->actingAs($room->owner)->postJson(route('api.v1.rooms.start', ['room' => $room]), ['consent_record_attendance' => false, 'consent_record' => false, 'consent_record_video' => false])
            ->assertSuccessful();
        $this->assertIsString($response->json('url'));

        // Try to start bbb meeting
        $response = LaravelHTTPClient::httpClient()->withOptions(['allow_redirects' => false])->get($response->json('url'));
        $this->assertEquals(302, $response->status());
        $this->assertArrayHasKey('Location', $response->headers());

        // Clear
        $room->refresh();
        (new MeetingService($room->latestMeeting))->end();
    }
}
