<?php

namespace App\Jobs;

use App\Models\RecordingFormat;
use DateTime;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use PharData;
use Storage;

class ProcessRecording implements ShouldQueue, ShouldBeUnique
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
        $this->file     = $file;
        $filename       = pathinfo($this->file, PATHINFO_FILENAME);
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
     * The number of seconds to wait before retrying the job.
     *
     * @var int
     */
    public $tryAgainAfter = 30;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Extract the tar file to a temp directory
            $phar     = new PharData(Storage::disk('recordings-spool')->path($this->file));
            $result   = $phar->extractTo(Storage::disk('recordings')->path($this->tempPath), null, true);

            // If the extraction failed, retry the job later (.tar file might be incomplete yet)
            // Cleanup any files that might have been extracted
            if (!$result) {
                \Log::error('Extraction failed for '.$this->file);
                $this->release($this->attempts() * $this->tryAgainAfter);
                $this->cleanup();

                return;
            }

            foreach (Storage::disk('recordings')->directories($this->tempPath) as $formatDirectory) {
                foreach (Storage::disk('recordings')->directories($formatDirectory) as $recordingDirectory) {
                    // Each recording directory inside each format has a metadata file describing the recording
                    // and files with the actual recording

                    $xmlContent = Storage::disk('recordings')->get($recordingDirectory.'/metadata.xml');
                    $xml        = simplexml_load_string($xmlContent);

                    // Create or update the recording format in the database
                    $recordingFormat = RecordingFormat::createFromRecordingXML($xml);

                    // Recording format was created or updated (found the corresponding room)
                    if ($recordingFormat != null) {
                        // Move the recording to the final destination
                        Storage::disk('recordings')->move($recordingDirectory, $recordingFormat->recording->id.'/'.$recordingFormat->format);
                    } else {
                        $this->fail('Room not found for recording '.$recordingDirectory);
                    }
                }
            }
        } catch (Exception $e) {
            // Extraction failed, retry the job later (.tar file might be incomplete yet)
            \Log::error('Extraction failed for '.$this->file, ['exception' => $e]);
            $this->release($this->attempts() * $this->tryAgainAfter);
            $this->cleanup();

            return;
        }

        // Remove .tar file as extraction was successful
        Storage::disk('recordings-spool')->delete($this->file);

        $this->cleanup();
    }

    /**
     * Remove the extracted files
     */
    public function cleanup(): void
    {
        Storage::disk('recordings')->deleteDirectory($this->tempPath);
    }
}
