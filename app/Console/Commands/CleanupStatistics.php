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
        // Remove all server statistics data older than the retention period
        $serverDay = now()->subDays(setting('statistics.servers.retention_period'))->toDateString();
        ServerStat::where('created_at', '<', $serverDay)->delete();

        // Remove all meeting statistics data older than the retention period
        $meetingDay = now()->subDays(setting('statistics.meetings.retention_period'))->toDateString();
        MeetingStat::where('created_at', '<', $meetingDay)->delete();
    }
}
