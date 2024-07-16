<?php

namespace App\Console\Commands;

use App\Enums\LinkButtonStyle;
use App\Enums\LinkTarget;
use App\Enums\TimePeriod;
use App\Models\Permission;
use App\Settings\BannerSettings;
use App\Settings\BigBlueButtonSettings;
use App\Settings\GeneralSettings;
use App\Settings\RecordingSettings;
use App\Settings\RoomSettings;
use App\Settings\ThemeSettings;
use App\Settings\UserSettings;
use Artisan;
use DB;
use Illuminate\Console\Command;
use Schema;

class UpgradeDatabaseCommand extends Command
{
    protected $signature = 'db:upgrade';

    protected $description = 'Upgrade PILOS database from v2/v3 to v4.';

    public function handle()
    {
        // Check for clear database by checking migration tables doesn't exist or no migration run yet
        if (! Schema::hasTable('migrations') || DB::table('migrations')->count() == 0) {
            $this->error('Database is missing');
            $this->info('Please run: php artisan migrate');

            return;
        }

        // Check v4 database exists by checking migration that doesn't exist in v2/v3
        if (DB::table('migrations')->where(['migration' => '2023_04_14_103858_create_big_blue_button_settings'])->exists()) {
            $this->info('Database is already upgraded');

            return;
        }

        // Run migration of old db to have db to latest v2/v3 version before upgrade
        Artisan::call('migrate --force --path=database/migrations/v2');
        $this->info('Upgraded to latest v2/v3 database');

        $oldSettings = DB::table('settings')->pluck('value', 'key')->toArray();

        // Run upgrade migration
        Artisan::call('migrate --force --path=database/migrations/migrate-to-v4');
        $this->info('Upgraded to v4 database');

        // Remove old migrations table and create new to have the same migration
        // as for a clean install, so artisan migrate works on future v2 upgrades
        $this->info('Cleared old migrations table');
        DB::table('migrations')->truncate();

        // List of v4 migrations that equal the result of upgrade from v2/v3 to v4
        $migrations = [
            '2014_10_12_000000_create_users_table',
            '2014_10_12_100000_create_password_resets_table',
            '2018_08_08_100000_create_telescope_entries_table',
            '2019_08_19_000000_create_failed_jobs_table',
            '2019_12_14_000001_create_personal_access_tokens_table',
            '2022_07_21_000001_create_roles_table',
            '2022_07_21_000002_create_role_user_table',
            '2022_07_21_000003_create_permissions_table',
            '2022_07_21_000004_create_permissions_role_table',
            '2022_07_21_000005_create_included_permissions_table',
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
            '2022_07_21_000019_create_server_stats_table',
            '2022_09_27_193354_create_sessions_table',
            '2022_09_29_101046_create_verify_emails_table',
            '2023_04_13_151058_create_session_data_table',
            '2023_04_14_083707_create_settings_table',
        ];
        foreach ($migrations as $migration) {
            DB::table('migrations')->insert([
                'migration' => $migration,
                'batch' => 1,
            ]);
        }
        $this->info('Created new migrations table');

        $this->info('Apply latest migrations');
        Artisan::call('migrate --force');

        $this->info('Migrating old application settings');
        $this->info('Overview of old settings:');
        $this->table(['Key', 'Value'], collect($oldSettings)->map(function ($value, $key) {
            return [$key, $value];
        }));

        // Apply old settings to new settings
        $generalSettings = app(GeneralSettings::class);
        if (isset($oldSettings['name'])) {
            $generalSettings->name = $oldSettings['name'];
        }
        if (isset($oldSettings['pagination_page_size'])) {
            $generalSettings->pagination_page_size = (int) $oldSettings['pagination_page_size'];
        }

        if (isset($oldSettings['default_timezone'])) {
            $generalSettings->default_timezone = $oldSettings['default_timezone'];
        }
        if (isset($oldSettings['help_url'])) {
            $generalSettings->help_url = $oldSettings['help_url'];
        }
        if (isset($oldSettings['legal_notice_url'])) {
            $generalSettings->legal_notice_url = $oldSettings['legal_notice_url'];
        }
        if (isset($oldSettings['privacy_policy_url'])) {
            $generalSettings->privacy_policy_url = $oldSettings['privacy_policy_url'];
        }
        $generalSettings->save();

        $themeSettings = app(ThemeSettings::class);
        if (isset($oldSettings['logo'])) {
            $themeSettings->logo = $oldSettings['logo'];
            $themeSettings->logo_dark = $oldSettings['logo'];
        }
        if (isset($oldSettings['favicon'])) {
            $themeSettings->favicon = $oldSettings['favicon'];
            $themeSettings->favicon_dark = $oldSettings['favicon'];
        }
        $themeSettings->save();

        $bannerSettings = app(BannerSettings::class);
        if (isset($oldSettings['banner.enabled'])) {
            $bannerSettings->enabled = $oldSettings['banner.enabled'] == '1';
        }
        if (isset($oldSettings['banner.title'])) {
            $bannerSettings->title = $oldSettings['banner.title'];
        }
        if (isset($oldSettings['banner.icon'])) {
            $bannerSettings->icon = $oldSettings['banner.icon'];
        }
        if (isset($oldSettings['banner.message'])) {
            $bannerSettings->message = $oldSettings['banner.message'];
        }
        if (isset($oldSettings['banner.link'])) {
            $bannerSettings->link = $oldSettings['banner.link'];
        }
        if (isset($oldSettings['banner.link_text'])) {
            $bannerSettings->link_text = $oldSettings['banner.link_text'];
        }
        if (isset($oldSettings['banner.color'])) {
            $bannerSettings->color = $oldSettings['banner.color'];
        }
        if (isset($oldSettings['banner.background'])) {
            $bannerSettings->background = $oldSettings['banner.background'];
        }
        if (isset($oldSettings['banner.link_style'])) {
            $bannerSettings->link_style = LinkButtonStyle::tryFrom($oldSettings['banner.link_style']) ?: LinkButtonStyle::PRIMARY;
        }
        if (isset($oldSettings['banner.link_target'])) {
            $bannerSettings->link_target = LinkTarget::tryFrom($oldSettings['banner.link_target']) ?: LinkTarget::BLANK;
        }
        $bannerSettings->save();

        $roomSettings = app(RoomSettings::class);
        if (isset($oldSettings['room_limit'])) {
            $roomSettings->limit = (int) $oldSettings['room_limit'];
        }
        if (isset($oldSettings['room_token_expiration'])) {
            $roomSettings->token_expiration = TimePeriod::tryFrom($oldSettings['room_token_expiration']) ?: TimePeriod::THREE_MONTHS;
        }
        if (isset($oldSettings['room_auto_delete.inactive_period'])) {
            $roomSettings->auto_delete_inactive_period = TimePeriod::tryFrom($oldSettings['room_auto_delete.inactive_period']) ?: TimePeriod::UNLIMITED;
        }
        if (isset($oldSettings['room_auto_delete.never_used_period'])) {
            $roomSettings->auto_delete_never_used_period = TimePeriod::tryFrom($oldSettings['room_auto_delete.never_used_period']) ?: TimePeriod::UNLIMITED;
        }
        if (isset($oldSettings['room_auto_delete.deadline_period'])) {
            $roomSettings->auto_delete_deadline_period = TimePeriod::tryFrom($oldSettings['room_auto_delete.deadline_period']) ?: TimePeriod::TWO_WEEKS;
        }
        $roomSettings->save();

        $userSettings = app(UserSettings::class);
        if (isset($oldSettings['password_change_allowed'])) {
            $userSettings->password_change_allowed = $oldSettings['password_change_allowed'] == '1';
        }
        $userSettings->save();

        $recordingSettings = app(RecordingSettings::class);
        if (isset($oldSettings['statistics.servers.enabled'])) {
            $recordingSettings->server_usage_enabled = $oldSettings['statistics.servers.enabled'] == '1';
        }
        if (isset($oldSettings['statistics.servers.retention_period'])) {
            $recordingSettings->server_usage_retention_period = TimePeriod::tryFrom($oldSettings['statistics.servers.retention_period']) ?: TimePeriod::ONE_MONTH;
        }
        if (isset($oldSettings['statistics.meetings.enabled'])) {
            $recordingSettings->meeting_usage_enabled = $oldSettings['statistics.meetings.enabled'] == '1';
        }
        if (isset($oldSettings['statistics.meetings.retention_period'])) {
            $recordingSettings->meeting_usage_retention_period = TimePeriod::tryFrom($oldSettings['statistics.meetings.retention_period']) ?: TimePeriod::ONE_MONTH;
        }
        if (isset($oldSettings['attendance.retention_period'])) {
            $recordingSettings->attendance_retention_period = TimePeriod::tryFrom($oldSettings['attendance.retention_period']) ?: TimePeriod::TWO_WEEKS;
        }
        $recordingSettings->save();

        $bigBlueButtonSettings = app(BigBlueButtonSettings::class);
        if (isset($oldSettings['bbb_logo'])) {
            $bigBlueButtonSettings->logo = $oldSettings['bbb_logo'];
        }
        if (isset($oldSettings['bbb_style'])) {
            $bigBlueButtonSettings->style = $oldSettings['bbb_style'];
        }
        if (isset($oldSettings['default_presentation'])) {
            $bigBlueButtonSettings->default_presentation = $oldSettings['default_presentation'];
        }
        $bigBlueButtonSettings->save();

        $this->info('Migrated old application settings, please check everything is correct in the settings page and adjust if necessary');

        // Apply changes to permissions and run seeder
        Permission::where('name', 'settings.manage')->update(['name' => 'admin.view']);
        Permission::where('name', 'applicationSettings.viewAny')->update(['name' => 'settings.viewAny']);
        Permission::where('name', 'applicationSettings.update')->update(['name' => 'settings.update']);
        Artisan::call('db:seed --force');

        $this->alert('Upgrade to v4 completed.');
    }
}
