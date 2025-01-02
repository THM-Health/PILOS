<?php

namespace App\Console\Commands;

use DB;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;
use Str;

class ImportDatabaseCommand extends Command
{
    protected $signature = 'db:import {file : path to sql file}';

    protected $description = 'Import database dump file';

    protected bool $error = false;

    protected $bar;

    public function setError(bool $error): void
    {
        $this->error = $error;
    }

    public function handle()
    {
        // Get path of sql file
        $file = realpath($this->argument('file'));
        // Check if file exists
        if (! $file) {
            $this->error('File not found');

            return 1;
        }

        $this->line('Importing database, this may take a while');

        // Get DB credentials
        $db = DB::connection()->getConfig();

        // Build command with pv to show progress of import
        switch ($db['driver']) {
            case 'mariadb':
            case 'mysql':
                $command = "pv -n -f $file | mariadb --user={$db['username']} --password={$db['password']} --host={$db['host']} --port={$db['port']} --database {$db['database']}";

                break;
            case 'pgsql':
                $connectionURI = "postgresql://{$db['username']}:{$db['password']}@{$db['host']}:{$db['port']}/{$db['database']}";
                $command = "pv -n -f $file | psql {$connectionURI}";

                break;
            default:
                $this->error('Database driver not supported');

                return 1;
        }

        $this->bar = $this->output->createProgressBar(100);

        // Run command and show output in realtime
        $process = Process::forever()->start($command, function (string $type, string $output) {
            if (Str::contains($output, 'ERROR')) {
                $this->bar->clear();
                $this->error($output);
                $this->setError(true);
            } elseif (is_numeric($output)) {
                $this->bar->setProgress($output);
            } else {
                $this->bar->clear();
                $this->warn($output);
            }
        });

        $process->wait();
        $this->bar->finish();
        $this->newLine(2);

        if ($this->error) {
            // Show success message
            $this->error('Import failed');

            return 1;
        } else {
            // Show success message
            $this->info('Import complete');

            return 0;
        }
    }
}
