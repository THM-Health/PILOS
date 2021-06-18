<?php

namespace App\Console;

use App\Console\Commands\CreateAdminUser;
use App\Console\Commands\BuildHistory;
use App\Console\Commands\DeleteObsoleteTokens;
use App\Console\Commands\DeleteUnverifiedNewUsers;
use App\Console\Commands\ImportGreenlight;
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
        ImportGreenlight::class,
        DeleteObsoleteTokens::class
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->command(BuildHistory::class)->everyMinute();
        $schedule->command(DeleteUnverifiedNewUsers::class)->everyMinute();
        $schedule->command(DeleteObsoleteTokens::class)->daily();
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
