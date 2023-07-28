<?php

namespace App\Console\Commands;

use App\Models\Meeting;
use App\Models\RecordingFormat;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use PharData;

class ImportRecordingsCommand extends Command
{
    protected $signature = 'import:recordings';

    protected $description = 'Command description';

    public function handle()
    {
        $files = Storage::disk('recordings')->files('import');
        foreach ($files as $file) {
            $validFile = preg_match("/([a-z0-9\-]*)(\.tar)/", basename($file), $matches);
            if (!$validFile) {
                continue;
            }

            $internalMeetingId = $matches[1];

            $meeting = Meeting::where('internal_meeting_id', $internalMeetingId)->first();
            if ($meeting == null) {
                continue;
            }

            $tempPath = 'temp/'.$internalMeetingId;
            $phar     = new PharData(Storage::disk('recordings')->path($file));
            $phar->extractTo(Storage::disk('recordings')->path($tempPath), null, true);

            foreach (Storage::disk('recordings')->directories($tempPath) as $directory) {
                $format = basename($directory);

                $tempPathRecordingFiles = $tempPath.'/'.$format.'/'.$internalMeetingId;

                $xmlContent = Storage::disk('recordings')->get($tempPathRecordingFiles.'/metadata.xml');
                $xml        = simplexml_load_string($xmlContent);

                RecordingFormat::createFromRecordingXML($xml);

                Storage::disk('recordings')->move($tempPathRecordingFiles, $meeting->room->id.'/'.$meeting->id.'/'.$format);
            }

            Storage::disk('recordings')->deleteDirectory($tempPath);
        }
    }
}
