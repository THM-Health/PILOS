<?php

namespace App\Console\Commands;

use App\Jobs\ProcessRecording;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Str;

class ImportRecordingsCommand extends Command
{
    protected $signature = 'import:recordings';

    protected $description = 'Command description';

    public function handle()
    {
        $files = Storage::disk('recordings')->files('import');
        foreach ($files as $file) {
            if (!Str::endsWith($file, '.tar')) {
                continue;
            }

            ProcessRecording::dispatch($file);
        }
    }
}
