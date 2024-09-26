<?php

namespace App\Jobs;

use App\Exceptions\RecordingExtractionFailed;
use App\Models\RecordingFormat;
use DateTime;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use PharData;
use Storage;
use Throwable;

class ProcessRecording implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 120;

    protected string $file;

    protected string $tempPath;

    /**
     * Create a new job instance.
     */
    public function __construct(string $file)
    {
        $this->onQueue('recordings');
        $this->file = $file;
        $filename = pathinfo($this->file, PATHINFO_FILENAME);
        $this->tempPath = 'temp/'.$filename;
    }

    /**
     * Get the tags that should be assigned to the job.
     *
     * @return array<int, string>
     */
    public function tags(): array
    {
        return ['importRecording'];
    }

    /**
     * The number of seconds after which the job's unique lock will be released.
     *
     * @var int
     */
    public $uniqueFor = 3600;

    /**
     * Get the unique ID for the job.
     */
    public function uniqueId(): string
    {
        return $this->file;
    }

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 0;

    /**
     * Determine the time at which the job should timeout.
     */
    public function retryUntil(): DateTime
    {
        return now()->addHour();
    }

    /**
     * Calculate the number of seconds to wait before retrying the job.
     *
     * @return array<int, int>
     */
    public function backoff(): array
    {
        // First retry after 30 seconds
        // Second after 60 seconds
        // Third and so on (until one hour) after 5 minutes each
        return [30, 60, 60 * 5];
    }

    /**
     * Execute the job.
     *
     * @throws RecordingExtractionFailed
     */
    public function handle(): void
    {
        // If the file is not found, delete the job, as it is not needed anymore
        if (! Storage::disk('recordings-spool')->exists($this->file) && ! Storage::disk('recordings-spool')->exists('failed/'.$this->file)) {
            \Log::error('Recording file '.$this->file.' not found');
            $this->delete();

            return;
        }

        // If file in not in the spool directory, but in the failed directory, move it back to the spool directory
        // Probably a retry of a failed job, move it back to the spool directory
        if (! Storage::disk('recordings-spool')->exists($this->file) && Storage::disk('recordings-spool')->exists('failed/'.$this->file)) {
            Storage::disk('recordings-spool')->move('failed/'.$this->file, $this->file);
        }

        try {
            // Extract the tar file to a temp directory
            $phar = new PharData(Storage::disk('recordings-spool')->path($this->file));
            $phar->extractTo(Storage::disk('recordings')->path($this->tempPath), null, true);

            // Find metadata.xml files
            $metadataFiles = array_filter(Storage::disk('recordings')->allFiles($this->tempPath), function ($file) {
                return str_ends_with($file, 'metadata.xml');
            });

            foreach ($metadataFiles as $metadataFile) {
                // Each directory with a metadata file inside is a recording format
                // the metadata file is describing the recording
                // and other files are the actual recording in the recording format

                $xmlContent = Storage::disk('recordings')->get($metadataFile);
                $xml = simplexml_load_string($xmlContent);

                // Create or update the recording format in the database
                $recordingFormat = RecordingFormat::createFromRecordingXML($xml);

                $formatDirectory = dirname($metadataFile);

                // Recording format was created or updated (found the corresponding room)
                if ($recordingFormat != null) {
                    // Move the recording to the final destination
                    Storage::disk('recordings')->move($formatDirectory, $recordingFormat->recording->id.'/'.$recordingFormat->format);
                } else {
                    // No room found for the recording format, fail whole file
                    // Admins should check where the error is coming from, each recording file should only contain data of one meeting
                    \Log::error('Associating recording file '.$this->file.' to a room failed');
                    $this->fail('Associating recording file '.$this->file.' to a room failed');

                    return;
                }
            }
        } catch (Exception $e) {
            // Extraction failed, retry the job later (.tar file might be incomplete yet)
            \Log::error('Extracting recording file '.$this->file.' failed');
            $this->cleanup();

            throw new RecordingExtractionFailed($this->file, previous: $e);
        }

        // Remove .tar file as extraction was successful
        $delete = Storage::disk('recordings-spool')->delete($this->file);
        if (! $delete) {
            \Log::error('Deleting recording file '.$this->file.' failed');
        }

        $this->cleanup();
    }

    /**
     * Handle a job failure.
     */
    public function failed(?Throwable $exception): void
    {
        Storage::disk('recordings-spool')->move($this->file, 'failed/'.$this->file);
    }

    /**
     * Remove the extracted files
     */
    public function cleanup(): void
    {
        Storage::disk('recordings')->deleteDirectory($this->tempPath);
    }
}
