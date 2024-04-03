<?php

namespace App\Console\Commands;

use App\Models\MeetingAttendee;
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
        // Remove all attendance data older than the retention period
        if (setting('attendance.retention_period') != -1) {
            $day = now()->subDays(setting('attendance.retention_period'))->toDateString();
            Log::info('Removing attendance data older than '.$day);
            MeetingAttendee::where('join', '<', $day)->delete();
        }
    }
}
