<?php

namespace App\Console;

use App\Console\Commands\CleanupAttendance;
use App\Console\Commands\CleanupRooms;
use App\Console\Commands\CleanupStatistics;
use App\Console\Commands\CreateAdminUser;
use App\Console\Commands\BuildHistory;
use App\Console\Commands\DeleteObsoleteTokens;
use App\Console\Commands\DeleteUnverifiedNewUsers;
use App\Console\Commands\ImportGreenlight2;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        BuildHistory::class,
        CreateAdminUser::class,
        ImportGreenlight2::class,
        CleanupAttendance::class,
        CleanupStatistics::class,
        DeleteObsoleteTokens::class,
        CleanupRooms::class
    ];

    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command(BuildHistory::class)->everyMinute();
        $schedule->command(DeleteUnverifiedNewUsers::class)->everyMinute();
        $schedule->command(CleanupStatistics::class)->daily();
        $schedule->command(CleanupAttendance::class)->daily();
        $schedule->command(CleanupRooms::class)->daily();
        $schedule->command(DeleteObsoleteTokens::class)->daily();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
