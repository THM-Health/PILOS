<?php

namespace App\Console\Commands;

use Artisan;
use DB;
use Illuminate\Console\Command;

class UpgradeDbV2Command extends Command
{
    protected $signature = 'upgrade:db-v2';

    protected $description = 'Upgrade database from PILOS v1 to v2.';

    public function handle()
    {
        Artisan::call('migrate --path=database/migrations/v1');
        Artisan::call('migrate --path=database/migrations/migrate-to-v2');

        $migrations = [
            '2014_10_12_000000_create_users_table',
            '2014_10_12_100000_create_password_resets_table',
            '2019_08_19_000000_create_failed_jobs_table',
            '2019_12_14_000001_create_personal_access_tokens_table',
            '2022_21_07_000001_create_roles_table',
            '2022_21_07_000002_create_role_user_table',
            '2022_21_07_000003_create_permissions_table',
            '2022_21_07_000004_create_permissions_role_table',
            '2022_21_07_000005_create_included_permissions_table',
            '2022_21_07_000006_create_settings_table',
            '2022_21_07_000007_create_servers_table',
            '2022_21_07_000008_create_server_pools_table',
            '2022_21_07_000009_create_server_server_pool_table',
            '2022_21_07_000010_create_room_types_table',
            '2022_21_07_000011_create_role_room_type_table',
            '2022_21_07_000012_create_rooms_table',
            '2022_21_07_000013_create_room_users_table',
            '2022_21_07_000014_create_room_files_table',
            '2022_21_07_000015_create_room_tokens_table',
            '2022_21_07_000016_create_meetings_table',
            '2022_21_07_000017_create_meeting_attendees_table',
            '2022_21_07_000018_create_meeting_stats_table',
            '2022_21_07_000019_create_server_stats_table'
        ];

        DB::table('migrations')->truncate();
        foreach ($migrations as $migration) {
            DB::table('migrations')->insert([
                'migration' => $migration,
                'batch'     => 1
            ]);
        }
    }
}
