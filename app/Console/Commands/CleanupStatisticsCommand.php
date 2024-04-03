<?php

namespace App\Console\Commands;

use App\Models\MeetingStat;
use App\Models\ServerStat;
use Illuminate\Console\Command;
use Log;

class CleanupStatisticsCommand extends Command
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
        if (setting('statistics.servers.retention_period') != -1) {
            $serverDay = now()->subDays(setting('statistics.servers.retention_period'))->toDateString();
            Log::info('Removing server statistics data older than '.$serverDay);
            ServerStat::where('created_at', '<', $serverDay)->delete();
        }

        // Remove all meeting statistics data older than the retention period
        if (setting('statistics.meetings.retention_period') != -1) {
            $meetingDay = now()->subDays(setting('statistics.meetings.retention_period'))->toDateString();
            Log::info('Removing meeting statistics data older than '.$serverDay);
            MeetingStat::where('created_at', '<', $meetingDay)->delete();
        }
    }
}
