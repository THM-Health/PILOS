<?php

namespace Tests\Unit\Console;

use App\Enums\RecordingMode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Queue;
use Tests\TestCase;

class ImportRecordingsCommandTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function testImportRecording()
    {
        Queue::fake();

        config(['filesystems.disks.recordings-spool.root' => 'tests/Fixtures/Recordings']);

        $this->artisan('import:recordings');

        Queue::assertCount(3);
    }

    /**
     * Test if the command does not import recordings when the recording mode is set to OpenCast.
     *
     * @return void
     */
    public function testOpenCastMode()
    {
        config(['recording.mode' => RecordingMode::OPENCAST]);

        Queue::fake();

        config(['filesystems.disks.recordings-spool.root' => 'tests/Fixtures/Recordings']);

        $this->artisan('import:recordings');

        Queue::assertCount(0);
    }
}
