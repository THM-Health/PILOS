<?php

namespace App\Console;

use App\Console\Commands\CleanupAttendanceCommand;
use App\Console\Commands\CleanupRecordingsCommand;
use App\Console\Commands\CleanupRoomsCommand;
use App\Console\Commands\CleanupStatisticsCommand;
use App\Console\Commands\CreateSuperuserCommand;
use App\Console\Commands\DeleteObsoleteTokensCommand;
use App\Console\Commands\DeleteUnverifiedNewUsersCommand;
use App\Console\Commands\ImportGreenlight2Command;
use App\Console\Commands\ImportRecordingsCommand;
use App\Console\Commands\PollServerCommand;
use Database\Seeders\Demo\CreateDemoSystem;
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
        PollServerCommand::class,
        CreateSuperuserCommand::class,
        ImportGreenlight2Command::class,
        CleanupAttendanceCommand::class,
        CleanupStatisticsCommand::class,
        DeleteObsoleteTokensCommand::class,
        CleanupRoomsCommand::class,
        CleanupRecordingsCommand::class,
        ImportRecordingsCommand::class,
        CreateDemoSystem::class,
    ];

    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command(PollServerCommand::class)->everyMinute()->onOneServer();
        $schedule->command(DeleteUnverifiedNewUsersCommand::class)->everyMinute()->onOneServer();
        $schedule->command(CleanupStatisticsCommand::class)->daily()->onOneServer();
        $schedule->command(CleanupAttendanceCommand::class)->daily()->onOneServer();
        $schedule->command(CleanupRoomsCommand::class)->daily()->onOneServer();
        $schedule->command(CleanupRecordingsCommand::class)->daily()->onOneServer();
        $schedule->command(DeleteObsoleteTokensCommand::class)->daily()->onOneServer();
        $schedule->command('telescope:prune')->daily()->onOneServer();
        $schedule->command('horizon:snapshot')->everyFiveMinutes()->onOneServer();
        $schedule->command(ImportRecordingsCommand::class)->everyMinute()->withoutOverlapping()->onOneServer();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
