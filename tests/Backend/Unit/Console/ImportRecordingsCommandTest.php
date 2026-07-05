<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace Tests\Backend\Unit\Console;

use App\Enums\RecordingAccess;
use App\Jobs\ProcessRecording;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\Backend\TestCase;

class ImportRecordingsCommandTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_import_recording()
    {
        Queue::fake();
        Storage::fake('recordings-spool');

        copy(base_path('tests/Backend/Fixtures/Recordings/invalid-recording.tar'), Storage::disk('recordings-spool')->path('invalid-recording.tar'));
        copy(base_path('tests/Backend/Fixtures/Recordings/multiple.tar'), Storage::disk('recordings-spool')->path('multiple.tar'));
        copy(base_path('tests/Backend/Fixtures/Recordings/notes.tar'), Storage::disk('recordings-spool')->path('notes.tar'));

        $this->artisan('import:recordings')->assertSuccessful();

        Queue::assertPushed(ProcessRecording::class, function ($job) {
            return $job->getFile() === 'invalid-recording.tar' && $job->getAccess() === RecordingAccess::OWNER;
        });
        Queue::assertPushed(ProcessRecording::class, function ($job) {
            return $job->getFile() === 'multiple.tar' && $job->getAccess() === RecordingAccess::OWNER;
        });
        Queue::assertPushed(ProcessRecording::class, function ($job) {
            return $job->getFile() === 'notes.tar' && $job->getAccess() === RecordingAccess::OWNER;
        });

        Queue::assertCount(3);
    }

    public function test_import_public_recording()
    {
        Queue::fake();
        Storage::fake('recordings-spool');
        Storage::disk('recordings-spool')->makeDirectory('public');

        copy(base_path('tests/Backend/Fixtures/Recordings/invalid-recording.tar'), Storage::disk('recordings-spool')->path('invalid-recording.tar'));
        copy(base_path('tests/Backend/Fixtures/Recordings/multiple.tar'), Storage::disk('recordings-spool')->path('public/multiple.tar'));
        copy(base_path('tests/Backend/Fixtures/Recordings/notes.tar'), Storage::disk('recordings-spool')->path('public/notes.tar'));

        $this->artisan('import:recordings')->assertSuccessful();

        Queue::assertPushed(ProcessRecording::class, function ($job) {
            return $job->getFile() === 'invalid-recording.tar' && $job->getAccess() === RecordingAccess::OWNER;
        });
        Queue::assertPushed(ProcessRecording::class, function ($job) {
            return $job->getFile() === 'public/multiple.tar' && $job->getAccess() === RecordingAccess::EVERYONE;
        });
        Queue::assertPushed(ProcessRecording::class, function ($job) {
            return $job->getFile() === 'public/notes.tar' && $job->getAccess() === RecordingAccess::EVERYONE;
        });

        Queue::assertCount(3);
    }

    public function test_import_recording_with_hook()
    {
        Queue::fake();

        Storage::fake('recordings-spool');

        copy(base_path('tests/Backend/Fixtures/Recordings/invalid-recording.tar'), Storage::disk('recordings-spool')->path('invalid-recording.tar'));
        copy(base_path('tests/Backend/Fixtures/Recordings/multiple.tar'), Storage::disk('recordings-spool')->path('multiple.tar'));
        copy(base_path('tests/Backend/Fixtures/Recordings/notes.tar'), Storage::disk('recordings-spool')->path('notes.tar'));

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

        Storage::fake('recordings-spool');

        copy(base_path('tests/Backend/Fixtures/Recordings/invalid-recording.tar'), Storage::disk('recordings-spool')->path('invalid-recording.tar'));
        copy(base_path('tests/Backend/Fixtures/Recordings/multiple.tar'), Storage::disk('recordings-spool')->path('multiple.tar'));
        copy(base_path('tests/Backend/Fixtures/Recordings/notes.tar'), Storage::disk('recordings-spool')->path('notes.tar'));

        // Import hook command to write "OK" to a file that does not exist
        $file = '/invalidPath/invalidFile';
        config(['recording.import_before_hook' => 'echo "OK" > '.$file]);

        $this->artisan('import:recordings')->assertFailed();

        // Check if the recordings were not queued
        Queue::assertCount(0);
    }
}
