<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;
use Str;

class ImportDatabaseCommand extends Command
{
    protected $signature = 'db:import {file : path to sql file}';

    protected $description = 'Import database dump file';

    protected bool $error = false;

    /**
     * @param bool $error
     */
    public function setError(bool $error): void
    {
        $this->error = $error;
    }

    public function handle()
    {
        // Get path of sql file
        $file = realpath($this->argument('file'));
        // Check if file exists
        if (!$file) {
            $this->error('File not found');
        }

        $this->info('Importing database, this may take a while');

        // Get DB credentials
        $db = [
            'username' => env('DB_USERNAME'),
            'password' => env('DB_PASSWORD'),
            'host'     => env('DB_HOST'),
            'database' => env('DB_DATABASE')
        ];

        // Build command with pv to show progress of import
        $command = "pv -f $file | mysql --user={$db['username']} --password={$db['password']} --host={$db['host']} --database {$db['database']}";

        // Run command and show output in realtime
        $process = Process::forever()->start($command, function (string $type, string $output) {
            if (Str::contains($output, 'ERROR')) {
                $this->error($output);
                $this->setError(true);
            } else {
                echo $output;
            }
        });

        $process->wait();

        if ($this->error) {
            // Show success message
            $this->error('Import failed');
        } else {
            // Show success message
            $this->info('Import complete');
        }
    }
}
