<?php

namespace App\Console\Commands;

use Artisan;
use DB;
use Illuminate\Console\Command;
use Schema;

class UpgradeDatabaseCommand extends Command
{
    protected $signature = 'db:upgrade';

    protected $description = 'Upgrade PILOS database from v1 to v2.';

    public function handle()
    {
        // Check for clear database by checking migration tables doesn't exist or no migration run yet
        if (!Schema::hasTable('migrations') || DB::table('migrations')->count() == 0) {
            $this->error('Database is missing');
            $this->info('Please run: php artisan migrate');

            return;
        }

        // Check v2 database exists by checking migration that doesn't exist in v1
        if (DB::table('migrations')->where(['migration' => '2022_07_21_000019_create_server_stats_table'])->exists()) {
            $this->info('Database is already upgraded');

            return;
        }

        // Run migration of old db to have db to latest v1 version before upgrade
        Artisan::call('migrate --path=database/migrations/v1');
        $this->info('Upgraded to latest v1 database');

        // Run upgrade migration
        Artisan::call('migrate --path=database/migrations/migrate-to-v2');
        $this->info('Upgraded to v2 database');

        // Remove old migrations table and create new to have the same migration
        // as for a clean install, so artisan migrate works on future v2 upgrades
        $this->info('Cleared old migrations table');
        DB::table('migrations')->truncate();

        // List of v2 migrations that equal the result of upgrade from v1
        $migrations = [
            '2014_10_12_000000_create_users_table',
            '2014_10_12_100000_create_password_resets_table',
            '2019_08_19_000000_create_failed_jobs_table',
            '2019_12_14_000001_create_personal_access_tokens_table',
            '2022_07_21_000001_create_roles_table',
            '2022_07_21_000002_create_role_user_table',
            '2022_07_21_000003_create_permissions_table',
            '2022_07_21_000004_create_permissions_role_table',
            '2022_07_21_000005_create_included_permissions_table',
            '2022_07_21_000006_create_settings_table',
            '2022_07_21_000007_create_servers_table',
            '2022_07_21_000008_create_server_pools_table',
            '2022_07_21_000009_create_server_server_pool_table',
            '2022_07_21_000010_create_room_types_table',
            '2022_07_21_000011_create_role_room_type_table',
            '2022_07_21_000012_create_rooms_table',
            '2022_07_21_000013_create_room_users_table',
            '2022_07_21_000014_create_room_files_table',
            '2022_07_21_000015_create_room_tokens_table',
            '2022_07_21_000016_create_meetings_table',
            '2022_07_21_000017_create_meeting_attendees_table',
            '2022_07_21_000018_create_meeting_stats_table',
            '2022_07_21_000019_create_server_stats_table'
        ];
        foreach ($migrations as $migration) {
            DB::table('migrations')->insert([
                'migration' => $migration,
                'batch'     => 1
            ]);
        }
        $this->info('Created new migrations table');

        $this->alert('Upgrade to v2 completed. Please upgrade to latest v2 database: php artisan migrate');
    }
}
