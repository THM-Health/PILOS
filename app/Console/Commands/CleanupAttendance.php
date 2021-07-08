<?php

namespace App\Console\Commands;

use App\MeetingAttendee;
use Illuminate\Console\Command;

class CleanupAttendance extends Command
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
        $day = now()->subDays(setting('attendance.retention_period'))->toDateString();
        MeetingAttendee::where('join', '<', $day)->delete();
    }
}
