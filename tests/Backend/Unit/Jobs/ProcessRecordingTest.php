<?php

declare(strict_types=1);

namespace Tests\Backend\Unit\Jobs;

use App\Enums\RecordingAccess;
use App\Exceptions\RecordingExtractionFailed;
use App\Jobs\ProcessRecording;
use App\Models\Meeting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\Backend\TestCase;
use TiMacDonald\Log\LogEntry;
use TiMacDonald\Log\LogFake;

class ProcessRecordingTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    const EXTERNAL_MEETING_ID = 'bf8d59d9-9b80-4666-be2c-4b7e56f5b8c9';

    const INTERNAL_MEETING_ID = '495513f19d7da5edb02237f3bca1ee0634f1e235-1712758751753';

    const START = 1712758751;

    const END = 1712758906;

    const TITLE = 'Demo Meeting';

    public function test_process_invalid_recording_file()
    {
        Storage::fake('recordings');
        Storage::fake('recordings-spool');

        Log::swap(new LogFake);
        Queue::fake();

        copy(base_path('tests/Backend/Fixtures/Recordings/invalid-recording.tar'), Storage::disk('recordings-spool')->path('invalid-recording.tar'));

        $job = (new ProcessRecording('invalid-recording.tar'))->withFakeQueueInteractions();

        $failed = false;
        try {
            $job->handle();
        } catch (RecordingExtractionFailed $e) {
            $failed = true;
        }

        $this->assertTrue($failed);

        Log::assertLogged(
            fn (LogEntry $log) => str_starts_with($log->message, 'Extracting recording file invalid-recording.tar failed')
                && str_contains($log->message, 'This does not look like a tar archive')
        );

        $this->assertCount(0, Storage::disk('recordings')->allFiles());
        $this->assertCount(1, Storage::disk('recordings-spool')->files(''));
    }

    public function test_rejects_recording_archive_with_symbolic_links()
    {
        Storage::fake('recordings');
        Storage::fake('recordings-spool');

        Log::swap(new LogFake);
        Queue::fake();

        copy(base_path('tests/Backend/Fixtures/Recordings/symlink-recording.tar'), Storage::disk('recordings-spool')->path('symlink-recording.tar'));

        $job = (new ProcessRecording('symlink-recording.tar'))->withFakeQueueInteractions();

        $job->handle();

        Log::assertLogged(
            fn (LogEntry $log) => str_starts_with($log->message, 'Recording file symlink-recording.tar contains symbolic links:')
                && str_contains($log->message, 'content/evil-link -> /etc/passwd')
        );

        $job->assertFailed();
        $this->assertCount(0, Storage::disk('recordings')->allFiles());
        $this->assertCount(1, Storage::disk('recordings-spool')->files(''));
    }

    /**
     * Test that recording tar files that contain files with absolute paths extracted
     * but the leading slash is stripped and resolved to a relative path
     *
     * When tar extracts archive members from an archive, it strips any leading slashes (‘/’) from the member name.
     * This causes absolute member names in the archive to be treated as relative file names.
     *
     * @see https://www.gnu.org/software/tar/manual/tar.html#Absolute-File-Names
     */
    public function test_strips_leading_slash_on_absolute_path_in_recording_tar()
    {
        Storage::fake('recordings');
        Storage::fake('recordings-spool');

        Meeting::factory()->create([
            'id' => self::EXTERNAL_MEETING_ID,
        ]);

        Log::swap(new LogFake);
        Queue::fake();

        // cleanup old /tmp/evil file
        if (file_exists('/tmp/evil')) {
            unlink('/tmp/evil');
        }

        copy(base_path('tests/Backend/Fixtures/Recordings/absolute-path-recording.tar'), Storage::disk('recordings-spool')->path('absolute-path-recording.tar'));

        $job = (new ProcessRecording('absolute-path-recording.tar'))->withFakeQueueInteractions();

        $job->handle();

        // Check file was not written to absolute path
        $this->assertFileDoesNotExist('/tmp/evil', 'Absolute path in recording tar should be rejected');

        // Check if other tar files are correctly extracted
        $this->assertTrue(Storage::disk('recordings')->directoryExists(self::INTERNAL_MEETING_ID));
        $this->assertFileExists(Storage::disk('recordings')->path(self::INTERNAL_MEETING_ID.'/notes/notes.pdf'));
    }

    /**
     * Test that recording tar files that contain files with ".." in the path are rejected
     *
     * File names containing ‘..’ can cause problems when extracting, so tar [...] prevents attempts to extract such files if that would affect files outside the working directory.
     *
     * @see https://www.gnu.org/software/tar/manual/tar.html#Absolute-File-Names
     */
    public function test_fails_on_relative_path_in_recording_tar()
    {
        Storage::fake('recordings');
        Storage::fake('recordings-spool');

        Meeting::factory()->create([
            'id' => self::EXTERNAL_MEETING_ID,
        ]);

        Log::swap(new LogFake);
        Queue::fake();

        copy(base_path('tests/Backend/Fixtures/Recordings/relative-path-recording.tar'), Storage::disk('recordings-spool')->path('relative-path-recording.tar'));

        $job = (new ProcessRecording('relative-path-recording.tar'))->withFakeQueueInteractions();

        $exception = null;

        try {
            $job->handle();
        } catch (RecordingExtractionFailed $e) {
            $exception = $e;
        }

        $this->assertInstanceOf(RecordingExtractionFailed::class, $exception);

        Log::assertLogged(
            fn (LogEntry $log) => str_starts_with($log->message, 'Extracting recording file relative-path-recording.tar failed:')
                && str_contains($log->message, "../evil: Member name contains '..'")
        );
    }

    public function test_process_valid_recording_file_but_not_meeting()
    {
        Storage::fake('recordings');
        Storage::fake('recordings-spool');

        Log::swap(new LogFake);
        Queue::fake();

        copy(base_path('tests/Backend/Fixtures/Recordings/notes.tar'), Storage::disk('recordings-spool')->path('notes.tar'));

        $this->assertCount(1, Storage::disk('recordings-spool')->files(''));
        $this->assertCount(0, Storage::disk('recordings-spool')->files('failed'));

        $job = (new ProcessRecording('notes.tar'))->withFakeQueueInteractions();

        $job->handle();

        Log::assertLogged(
            fn (LogEntry $log) => str_starts_with($log->message, 'Associating recording file notes.tar to a room failed')
        );

        $job->assertFailed();

        // Call failed method to simulate the job failed
        $job->failed(new RecordingExtractionFailed);

        $this->assertCount(0, Storage::disk('recordings-spool')->files(''));
        $this->assertCount(1, Storage::disk('recordings-spool')->files('failed'));
    }

    public function test_missing_file()
    {
        Storage::fake('recordings');
        Storage::fake('recordings-spool');

        Log::swap(new LogFake);
        Queue::fake();

        $job = (new ProcessRecording('notes.tar'))->withFakeQueueInteractions();

        $job->handle();

        Log::assertLogged(
            fn (LogEntry $log) => str_starts_with($log->message, 'Recording file notes.tar not found')
        );

        $job->assertDeleted();
    }

    public function test_retry_failed_job()
    {
        Storage::fake('recordings');
        Storage::fake('recordings-spool');

        $meeting = Meeting::factory()->create([
            'id' => self::EXTERNAL_MEETING_ID,
        ]);

        Log::swap(new LogFake);
        Queue::fake();

        Storage::disk('recordings-spool')->makeDirectory('failed');
        copy(base_path('tests/Backend/Fixtures/Recordings/notes.tar'), Storage::disk('recordings-spool')->path('failed/notes.tar'));

        $this->assertCount(1, Storage::disk('recordings-spool')->files('failed'));
        $this->assertCount(0, Storage::disk('recordings-spool')->files(''));

        $job = (new ProcessRecording('notes.tar'))->withFakeQueueInteractions();

        $job->handle();

        $this->assertCount(0, Storage::disk('recordings-spool')->files(''));
        $this->assertCount(0, Storage::disk('recordings-spool')->files('failed'));

        // Check if recording was added
        $this->assertCount(1, $meeting->room->recordings);
    }

    public function test_single_format()
    {
        Storage::fake('recordings');
        Storage::fake('recordings-spool');

        $meeting = Meeting::factory()->create([
            'id' => self::EXTERNAL_MEETING_ID,
        ]);

        Log::swap(new LogFake);
        Queue::fake();

        copy(base_path('tests/Backend/Fixtures/Recordings/notes.tar'), Storage::disk('recordings-spool')->path('notes.tar'));

        $this->assertCount(1, Storage::disk('recordings-spool')->files(''));

        $job = (new ProcessRecording('notes.tar'))->withFakeQueueInteractions();

        $job->handle();

        $this->assertCount(0, Storage::disk('recordings-spool')->files(''));
        $this->assertCount(0, Storage::disk('recordings-spool')->files('failed'));

        // Check if recording was added
        $this->assertCount(1, $meeting->room->recordings);
        $recording = $meeting->room->recordings->first();
        $this->assertEquals(self::TITLE, $recording->description);
        $this->assertEquals(RecordingAccess::OWNER, $recording->access);
        $this->assertEquals(self::START, $recording->start->getTimestamp());
        $this->assertEquals(self::END, $recording->end->getTimestamp());

        // Check if formats were added to the database
        $formats = $recording->formats;
        $this->assertCount(1, $formats);

        // Check if formats are enabled and have the correct URL (from the metadata.xml)
        $notes = $formats->firstWhere('format', 'notes');
        $this->assertFalse($notes->disabled);
        $this->assertEquals('/notes/'.self::INTERNAL_MEETING_ID.'/notes.pdf', $notes->url);

        // Check if files are correctly extracted (list incomplete)
        $this->assertTrue(Storage::disk('recordings')->directoryExists(self::INTERNAL_MEETING_ID));
        $this->assertFileExists(Storage::disk('recordings')->path(self::INTERNAL_MEETING_ID.'/notes/notes.pdf'));
    }

    public function test_multiple_formats()
    {
        Storage::fake('recordings');
        Storage::fake('recordings-spool');

        $meeting = Meeting::factory()->create([
            'id' => self::EXTERNAL_MEETING_ID,
        ]);

        Log::swap(new LogFake);
        Queue::fake();

        copy(base_path('tests/Backend/Fixtures/Recordings/multiple.tar'), Storage::disk('recordings-spool')->path('multiple.tar'));

        $this->assertCount(1, Storage::disk('recordings-spool')->files(''));

        $job = (new ProcessRecording('multiple.tar'))->withFakeQueueInteractions();

        $job->handle();

        $this->assertCount(0, Storage::disk('recordings-spool')->files(''));
        $this->assertCount(0, Storage::disk('recordings-spool')->files('failed'));

        // Check if recording was added
        $this->assertCount(1, $meeting->room->recordings);
        $recording = $meeting->room->recordings->first();
        $this->assertEquals(self::TITLE, $recording->description);
        $this->assertEquals(RecordingAccess::OWNER, $recording->access);
        $this->assertEquals(self::START, $recording->start->getTimestamp());
        $this->assertEquals(self::END, $recording->end->getTimestamp());

        // Check if formats were added to the database
        $formats = $recording->formats;
        $this->assertCount(5, $formats);

        // Check if formats are enabled and have the correct URL (from the metadata.xml)
        $notes = $formats->firstWhere('format', 'notes');
        $this->assertFalse($notes->disabled);
        $this->assertEquals('/notes/'.self::INTERNAL_MEETING_ID.'/notes.pdf', $notes->url);

        // Check if files are correctly extracted (list incomplete)
        $this->assertTrue(Storage::disk('recordings')->directoryExists(self::INTERNAL_MEETING_ID));
        $this->assertFileExists(Storage::disk('recordings')->path(self::INTERNAL_MEETING_ID.'/notes/notes.pdf'));
        $this->assertFileExists(Storage::disk('recordings')->path(self::INTERNAL_MEETING_ID.'/podcast/audio.ogg'));
        $this->assertFileExists(Storage::disk('recordings')->path(self::INTERNAL_MEETING_ID.'/screenshare/screenshare-0.webm'));
        $this->assertFileExists(Storage::disk('recordings')->path(self::INTERNAL_MEETING_ID.'/presentation/video/webcams.webm'));
        $this->assertFileExists(Storage::disk('recordings')->path(self::INTERNAL_MEETING_ID.'/video/video-0.m4v'));
    }

    public function test_public()
    {
        Storage::fake('recordings');
        Storage::fake('recordings-spool');

        $meeting = Meeting::factory()->create([
            'id' => self::EXTERNAL_MEETING_ID,
        ]);

        Log::swap(new LogFake);
        Queue::fake();

        Storage::disk('recordings-spool')->makeDirectory('public');
        copy(base_path('tests/Backend/Fixtures/Recordings/notes.tar'), Storage::disk('recordings-spool')->path('public/notes.tar'));

        $this->assertCount(1, Storage::disk('recordings-spool')->files('public'));

        $job = (new ProcessRecording('public/notes.tar', RecordingAccess::EVERYONE))->withFakeQueueInteractions();

        $job->handle();

        $this->assertCount(0, Storage::disk('recordings-spool')->files(''));
        $this->assertCount(0, Storage::disk('recordings-spool')->files('failed'));

        // Check if recording was added
        $this->assertCount(1, $meeting->room->recordings);
        $recording = $meeting->room->recordings->first();
        $this->assertEquals(self::TITLE, $recording->description);
        $this->assertEquals(RecordingAccess::EVERYONE, $recording->access);
        $this->assertEquals(self::START, $recording->start->getTimestamp());
        $this->assertEquals(self::END, $recording->end->getTimestamp());

        // Check if formats were added to the database
        $formats = $recording->formats;
        $this->assertCount(1, $formats);

        // Check if formats are enabled and have the correct URL (from the metadata.xml)
        $notes = $formats->firstWhere('format', 'notes');
        $this->assertFalse($notes->disabled);
        $this->assertEquals('/notes/'.self::INTERNAL_MEETING_ID.'/notes.pdf', $notes->url);

        // Check if files are correctly extracted (list incomplete)
        $this->assertTrue(Storage::disk('recordings')->directoryExists(self::INTERNAL_MEETING_ID));
        $this->assertFileExists(Storage::disk('recordings')->path(self::INTERNAL_MEETING_ID.'/notes/notes.pdf'));
    }
}
