<?php

namespace Tests\Backend\Unit\Console;

use App\Enums\TimePeriod;
use App\Models\Recording;
use App\Models\RecordingFormat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Storage;
use Tests\Backend\TestCase;

class CleanupRecordingsCommandTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_retention_period_disabled()
    {
        // Create fake recordings
        $recording1 = Recording::factory()->create(['start' => now()->subDays(10)]);
        $recording2 = Recording::factory()->create(['start' => now()->subDays(5)]);

        // Set the retention period to unlimited
        $this->recordingSettings->recording_retention_period = TimePeriod::UNLIMITED;
        $this->recordingSettings->save();

        $this->artisan('cleanup:recordings');

        // Check database
        $this->assertModelExists($recording1);
        $this->assertModelExists($recording2);
    }

    public function test_retention_period_enabled()
    {
        Storage::fake('recordings');

        // Create fake recordings
        $recording1 = Recording::factory()->create(['start' => now()->subDays(10)]);
        $recording2 = Recording::factory()->create(['start' => now()->subDays(7)]);

        // Create formats
        $formatNotesRecording1 = RecordingFormat::factory()->create(['recording_id' => $recording1->id, 'format' => 'notes']);
        $formatNotesRecording2 = RecordingFormat::factory()->create(['recording_id' => $recording2->id, 'format' => 'notes']);

        // Create folder with recording files
        Storage::disk('recordings')->makeDirectory($recording1->id);
        Storage::disk('recordings')->makeDirectory($recording1->id.'/notes');
        UploadedFile::fake()->create('document.pdf', 100, 'application/pdf')->storeAs($recording1->id.'/notes', 'document.pdf', 'recordings');

        Storage::disk('recordings')->makeDirectory($recording2->id);
        Storage::disk('recordings')->makeDirectory($recording2->id.'/notes');
        UploadedFile::fake()->create('document.pdf', 100, 'application/pdf')->storeAs($recording2->id.'/notes', 'document.pdf', 'recordings');

        // Set the retention period to a week
        $this->recordingSettings->recording_retention_period = TimePeriod::ONE_WEEK;
        $this->recordingSettings->save();

        $this->artisan('cleanup:recordings');

        // Check database
        $this->assertModelMissing($recording1);
        $this->assertModelMissing($formatNotesRecording1);
        $this->assertModelExists($recording2);
        $this->assertModelExists($formatNotesRecording2);

        // Check storage
        $this->assertDirectoryDoesNotExist(Storage::disk('recordings')->path($recording1->id));
        $this->assertDirectoryExists(Storage::disk('recordings')->path($recording2->id));
    }
}
