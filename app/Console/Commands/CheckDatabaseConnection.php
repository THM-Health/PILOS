<?php

namespace App\Console\Commands;

use DB;
use Exception;
use Illuminate\Console\Command;

class CheckDatabaseConnection extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check the database connection.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            DB::connection()->getPDO();
            $this->info('Successfully connected to the database.');

            return 0;
        } catch (Exception $e) {
            $this->error('Connecting to the database failed.');

            return 1;
        }
    }
}
