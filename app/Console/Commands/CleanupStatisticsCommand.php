<?php

namespace App\Console\Commands;

use App\Enums\TimePeriod;
use App\Models\MeetingStat;
use App\Models\ServerStat;
use App\Settings\RecordingSettings;
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
        $serverRetentionPeriod = app(RecordingSettings::class)->server_usage_retention_period;
        if ($serverRetentionPeriod != TimePeriod::UNLIMITED) {
            $serverDay = now()->subDays($serverRetentionPeriod->value)->toDateString();
            Log::info('Removing server statistics data older than '.$serverDay);
            ServerStat::where('created_at', '<', $serverDay)->delete();
        }

        // Remove all meeting statistics data older than the retention period
        $meetingRetentionPeriod = app(RecordingSettings::class)->meeting_usage_retention_period;
        if ($meetingRetentionPeriod != TimePeriod::UNLIMITED) {
            $meetingDay = now()->subDays($meetingRetentionPeriod->value)->toDateString();
            Log::info('Removing meeting statistics data older than '.$meetingDay);
            MeetingStat::where('created_at', '<', $meetingDay)->delete();
        }
    }
}
