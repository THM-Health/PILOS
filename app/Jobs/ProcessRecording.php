<?php

namespace App\Jobs;

use App\Models\RecordingFormat;
use DateTime;
use Exception;
use File;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use PharData;
use Storage;

class ProcessRecording implements ShouldQueue
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
        $this->file     = $file;
        $filename       = pathinfo($this->file, PATHINFO_FILENAME);
        $this->tempPath = 'temp/'.$filename;
    }

    /**
     * Determine the time at which the job should timeout.
     */
    public function retryUntil(): DateTime
    {
        return now()->addHour();
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Extract the tar file to a temp directory
            $phar     = new PharData(Storage::disk('recordings')->path($this->file));
            $result   = $phar->extractTo(Storage::disk('recordings')->path($this->tempPath), null, true);

            // If the extraction failed, retry the job later (.tar file might be incomplete yet)
            // Cleanup any files that might have been extracted
            if (!$result) {
                $this->release($this->attempts() * 30);
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
            $this->release($this->attempts() * 30);
            $this->cleanup();

            return;
        }

        // Remove .tar file as extraction was successful
        Storage::disk('recordings')->delete($this->file);

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
