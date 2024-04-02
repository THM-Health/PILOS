<?php

namespace App\Console\Commands;

use App\Models\Recording;
use Illuminate\Console\Command;
use Log;

class CleanupRecordingsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cleanup:recordings';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Remove recordings after retention period';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        // Remove all recordings older than the retention period
        $deleteDay = now()->subDays(setting('recording.retention_period'))->toDateString();
        Log::info('Removing recordings data older than '.$deleteDay);
        Recording::where('start', '<', $deleteDay)->delete();
    }
}
