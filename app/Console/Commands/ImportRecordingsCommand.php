<?php

namespace App\Console\Commands;

use App\Jobs\ProcessRecording;
use Config;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Str;

class ImportRecordingsCommand extends Command
{
    protected $signature = 'import:recordings';

    protected $description = 'Detect and import new recordings from the recordings spool directory.';

    public function handle()
    {
        $hook_script_path = Config::get('recording.import_before_hook');
        if ($hook_script_path) {
            $this->info('Invoking recording import before hook '.$hook_script_path);
            $result = Process::run($hook_script_path);
            if ($result->failed()) {
                $this->error(trim($result->errorOutput()));

                return 1;
            }
        }

        $files = Storage::disk('recordings-spool')->files();
        foreach ($files as $file) {
            if (! Str::endsWith($file, '.tar')) {
                continue;
            }

            ProcessRecording::dispatch($file);
        }
    }
}
