<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\RecordingAccess;
use App\Jobs\ProcessRecording;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportRecordingsCommand extends Command
{
    protected $signature = 'import:recordings';

    protected $description = 'Detect and import new recordings from the recordings spool directory.';

    public function handle()
    {
        $hook_script_path = config('recording.import_before_hook');
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

        $files = Storage::disk('recordings-spool')->files('public');
        foreach ($files as $file) {
            if (! Str::endsWith($file, '.tar')) {
                continue;
            }

            ProcessRecording::dispatch($file, RecordingAccess::EVERYONE);
        }
    }
}
