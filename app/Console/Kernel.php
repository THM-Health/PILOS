<?php

namespace App\Console;

use App\Console\Commands\CleanupAttendance;
use App\Console\Commands\CleanupRooms;
use App\Console\Commands\CleanupStatistics;
use App\Console\Commands\BuildHistory;
use App\Console\Commands\CreateSuperuser;
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
        CreateSuperuser::class,
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
        $schedule->command(BuildHistory::class)->everyMinute()->onOneServer();
        $schedule->command(DeleteUnverifiedNewUsers::class)->everyMinute()->onOneServer();
        $schedule->command(CleanupStatistics::class)->daily()->onOneServer();
        $schedule->command(CleanupAttendance::class)->daily()->onOneServer();
        $schedule->command(CleanupRooms::class)->daily()->onOneServer();
        $schedule->command(DeleteObsoleteTokens::class)->daily()->onOneServer();
        $schedule->command('telescope:prune')->daily()->onOneServer();
        $schedule->command('horizon:snapshot')->everyFiveMinutes()->onOneServer();
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
