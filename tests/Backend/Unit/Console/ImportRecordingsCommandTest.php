<?php

namespace Tests\Backend\Unit\Console;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Queue;
use Tests\Backend\TestCase;

class ImportRecordingsCommandTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function testImportRecording()
    {
        Queue::fake();

        config(['filesystems.disks.recordings-spool.root' => 'tests/Backend/Fixtures/Recordings']);

        $this->artisan('import:recordings');

        Queue::assertCount(3);
    }
}
