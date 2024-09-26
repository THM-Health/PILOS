<?php

namespace App\Console\Commands;

use App\Enums\TimePeriod;
use App\Models\MeetingAttendee;
use App\Settings\RecordingSettings;
use Illuminate\Console\Command;
use Log;

class CleanupAttendanceCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cleanup:attendance';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Removed attendance data after retention period';

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle()
    {
        $retentionPeriod = app(RecordingSettings::class)->attendance_retention_period;

        // Remove all attendance data older than the retention period
        if ($retentionPeriod != TimePeriod::UNLIMITED) {
            $day = now()->subDays($retentionPeriod->value)->toDateString();
            Log::info('Removing attendance data older than '.$day);
            MeetingAttendee::where('join', '<', $day)->delete();
        }
    }
}
