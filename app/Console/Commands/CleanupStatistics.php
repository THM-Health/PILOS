<?php

namespace App\Console\Commands;

use App\MeetingStat;
use App\ServerStat;
use Illuminate\Console\Command;

class CleanupStatistics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cleanup:statistics';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Removed server and meeting usage data after retention period';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        // Remove all attendance data older than the retention period
        $day = now()->subDays(setting('attendance.retention_period'))->toDateString();
        ServerStat::where('created_at', '<', $day)->delete();
        MeetingStat::where('created_at', '<', $day)->delete();
    }
}
