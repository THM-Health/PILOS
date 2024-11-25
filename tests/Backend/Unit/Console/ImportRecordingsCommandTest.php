<?php

namespace Tests\Backend\Unit\Console;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Queue;
use Tests\Backend\TestCase;

class ImportRecordingsCommandTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_import_recording()
    {
        Queue::fake();

        config(['filesystems.disks.recordings-spool.root' => 'tests/Backend/Fixtures/Recordings']);

        $this->artisan('import:recordings')->assertSuccessful();

        Queue::assertCount(3);
    }

    public function test_import_recording_with_hook()
    {
        Queue::fake();

        config(['filesystems.disks.recordings-spool.root' => 'tests/Backend/Fixtures/Recordings']);

        // Import hook command to write "OK" to a temp file
        $tempFile = tempnam(sys_get_temp_dir(), 'recording-import-hook-test');
        config(['recording.import_before_hook' => 'echo "OK" > '.$tempFile]);

        $this->artisan('import:recordings')->assertSuccessful();

        // Check if hook was executed
        $this->assertStringContainsString('OK', file_get_contents($tempFile));
        // Clean up
        unlink($tempFile);

        // Check if the recordings were queued
        Queue::assertCount(3);
    }

    public function test_import_recording_with_failing_hook()
    {
        Queue::fake();

        config(['filesystems.disks.recordings-spool.root' => 'tests/Backend/Fixtures/Recordings']);

        // Import hook command to write "OK" to a file that does not exist
        $file = '/invalidPath/invalidFile';
        config(['recording.import_before_hook' => 'echo "OK" > '.$file]);

        $this->artisan('import:recordings')->assertFailed();

        // Check if the recordings were not queued
        Queue::assertCount(0);
    }
}
