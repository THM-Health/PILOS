<?php

namespace App\Console\Commands;

use App\Jobs\ProcessRecording;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Str;

class ImportRecordingsCommand extends Command
{
    protected $signature = 'import:recordings';

    protected $description = 'Detect and import new recordings from the recordings spool directory.';

    public function handle()
    {
        $files = Storage::disk('recordings-spool')->files();
        foreach ($files as $file) {
            if (! Str::endsWith($file, '.tar')) {
                continue;
            }

            ProcessRecording::dispatch($file);
        }
    }
}
