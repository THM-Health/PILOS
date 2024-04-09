<?php

namespace Tests\Unit\Console;

use App\Enums\LinkButtonStyle;
use App\Enums\LinkTarget;
use App\Enums\TimePeriod;
use App\Settings\BannerSettings;
use App\Settings\BigBlueButtonSettings;
use App\Settings\GeneralSettings;
use App\Settings\RecordingSettings;
use App\Settings\RoomSettings;
use App\Settings\UserSettings;
use DB;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class UpgradeDatabaseTest extends TestCase
{
    use DatabaseMigrations, WithFaker;

    /**
     * Test upgrade with v2 database
     *
     * @return void
     */
    public function testV2Database()
    {
        // Create fresh v2 database
        $this->artisan('migrate:fresh', ['--path' => 'database/migrations/v2']);
        $migrations_v2 = DB::table('migrations')->pluck('migration')->toArray();

        // Upgrade to v2 database
        $this->artisan('db:upgrade')
            ->expectsOutput('Upgraded to latest v2 database')
            ->expectsOutput('Upgraded to v4 database')
            ->expectsOutput('Cleared old migrations table')
            ->expectsOutput('Created new migrations table')
            ->expectsOutputToContain('Upgrade to v4 completed. Please upgrade to latest v4 database: php artisan migrate');

        $migrations_upgrade = DB::table('migrations')->pluck('migration')->toArray();

        // Check migration table was rewritten
        $this->assertNotEqualsCanonicalizing($migrations_upgrade, $migrations_v2);

        // Check running upgrade again
        $this->artisan('db:upgrade')
            ->expectsOutput('Database is already upgraded');

        // Create v4 database
        $this->artisan('migrate:fresh');
        $migrations_v4 = DB::table('migrations')->pluck('migration')->toArray();

        // Check migration table after upgrade starts with the same as a fresh v4 database
        foreach ($migrations_upgrade as $key => $migration) {
            $this->assertEquals($migration, $migrations_v4[$key]);
        }
    }

    /**
     * Try to run upgrade on v2 database
     *
     * @return void
     */
    public function testV4Database()
    {
        // Create new v4 db
        $this->artisan('migrate:fresh');

        // Try to upgrade
        $this->artisan('db:upgrade')
            ->expectsOutput('Database is already upgraded');
    }

    /**
     * Test update on empty database
     *
     * @return void
     */
    public function testEmptyDatabase()
    {
        // Drop all tables
        $this->artisan('db:wipe');

        // Try to run upgrade on empty database
        $this->artisan('db:upgrade')
            ->expectsOutput('Database is missing')
            ->expectsOutput('Please run: php artisan migrate');

        // Create database with only an empty migrations table
        $this->artisan('migrate:fresh');
        $this->artisan('migrate:rollback');

        // Try to run upgrade on database with empty migrations table
        $this->artisan('db:upgrade')
            ->expectsOutput('Database is missing')
            ->expectsOutput('Please run: php artisan migrate');

        // Restore database
        $this->artisan('migrate:fresh');
    }

    public function testMigrateSettings()
    {
        // Create fresh v2 database
        $this->artisan('migrate:fresh', ['--path' => 'database/migrations/v2']);
        DB::table('migrations')->pluck('migration')->toArray();

        // Set old settings
        DB::table('settings')->insert([
            ['key' => 'name', 'value' => 'Old App Name'],
            ['key' => 'logo', 'value' => '/images/old-logo.svg'],
            ['key' => 'favicon', 'value' => '/images/old-favicon.ico'],
            ['key' => 'pagination_page_size', 'value' => '10'],
            ['key' => 'default_timezone', 'value' => 'Europe/Berlin'],
            ['key' => 'help_url', 'value' => 'https://help.example.com'],
            ['key' => 'legal_notice_url', 'value' => 'https://legal.example.com'],
            ['key' => 'privacy_policy_url', 'value' => 'https://privacy.example.com'],

            ['key' => 'banner.enabled', 'value' => '1'],
            ['key' => 'banner.message', 'value' => 'Welcome to the old app'],
            ['key' => 'banner.title', 'value' => 'Welcome'],
            ['key' => 'banner.color', 'value' => '#333'],
            ['key' => 'banner.background', 'value' => '#fcdf02'],
            ['key' => 'banner.link', 'value' => 'https://example.com'],
            ['key' => 'banner.link_text', 'value' => 'More info'],
            ['key' => 'banner.link_style', 'value' => 'secondary'],
            ['key' => 'banner.link_target', 'value' => 'self'],

            ['key' => 'room_limit', 'value' => '5'],
            ['key' => 'room_pagination_page_size', 'value' => '6'],
            ['key' => 'room_token_expiration', 'value' => '-1'],
            ['key' => 'room_auto_delete.inactive_period', 'value' => '365'],
            ['key' => 'room_auto_delete.never_used_period', 'value' => '90'],
            ['key' => 'room_auto_delete.deadline_period', 'value' => '7'],

            ['key' => 'password_change_allowed', 'value' => '0'],

            ['key' => 'statistics.servers.enabled', 'value' => '1'],
            ['key' => 'statistics.servers.retention_period', 'value' => '365'],
            ['key' => 'statistics.meetings.enabled', 'value' => '0'],
            ['key' => 'statistics.meetings.retention_period', 'value' => '100'],
            ['key' => 'attendance.retention_period', 'value' => '90'],

            ['key' => 'bbb_logo', 'value' => 'https://example.com/bbb-logo.svg'],
            ['key' => 'bbb_style', 'value' => 'https://example.com/bbb.css'],
            ['key' => 'default_presentation', 'value' => 'https://example.com/default.pdf'],

        ]);

        // Upgrade to v4 database
        $this->artisan('db:upgrade')
            /*->expectsTable(
                ['Key', 'Value'],
                [
                    ['name', 'Old App Name'],
                    ['logo', '/images/old-logo.svg'],
                    ['pagination_page_size', '10'],
                ]
            )*/;

        // Check settings
        $generalSettings = app(GeneralSettings::class);
        $this->assertEquals('Old App Name', $generalSettings->name);
        $this->assertEquals('/images/old-logo.svg', $generalSettings->logo);
        $this->assertEquals('/images/old-favicon.ico', $generalSettings->favicon);
        $this->assertEquals(10, $generalSettings->pagination_page_size);
        $this->assertEquals('Europe/Berlin', $generalSettings->default_timezone);
        $this->assertEquals('https://help.example.com', $generalSettings->help_url);
        $this->assertEquals('https://legal.example.com', $generalSettings->legal_notice_url);
        $this->assertEquals('https://privacy.example.com', $generalSettings->privacy_policy_url);

        // Check banner settings
        $bannerSettings = app(BannerSettings::class);
        $this->assertTrue($bannerSettings->enabled);
        $this->assertEquals('Welcome to the old app', $bannerSettings->message);
        $this->assertEquals('Welcome', $bannerSettings->title);
        $this->assertEquals('#333', $bannerSettings->color);
        $this->assertEquals('#fcdf02', $bannerSettings->background);
        $this->assertEquals('https://example.com', $bannerSettings->link);
        $this->assertEquals('More info', $bannerSettings->link_text);
        $this->assertEquals(LinkButtonStyle::SECONDARY, $bannerSettings->link_style);
        $this->assertEquals(LinkTarget::SELF, $bannerSettings->link_target);

        // Check room settings
        $roomSettings = app(RoomSettings::class);
        $this->assertEquals(5, $roomSettings->limit);
        $this->assertEquals(6, $roomSettings->pagination_page_size);
        $this->assertEquals(TimePeriod::UNLIMITED, $roomSettings->token_expiration);
        $this->assertEquals(TimePeriod::ONE_YEAR, $roomSettings->auto_delete_inactive_period);
        $this->assertEquals(TimePeriod::THREE_MONTHS, $roomSettings->auto_delete_never_used_period);
        $this->assertEquals(TimePeriod::ONE_WEEK, $roomSettings->auto_delete_deadline_period);

        // Check user settings
        $userSettings = app(UserSettings::class);
        $this->assertFalse($userSettings->password_change_allowed);

        // Check recording settings
        $recordingSettings = app(RecordingSettings::class);
        $this->assertTrue($recordingSettings->server_usage_enabled);
        $this->assertEquals(TimePeriod::ONE_YEAR, $recordingSettings->server_usage_retention_period);
        $this->assertFalse($recordingSettings->meeting_usage_enabled);
        // Fallback to default, as old setting 100 days is not in TimePeriod
        $this->assertEquals(TimePeriod::ONE_MONTH, $recordingSettings->meeting_usage_retention_period);
        $this->assertEquals(TimePeriod::THREE_MONTHS, $recordingSettings->attendance_retention_period);

        // Check BigBlueButton settings
        $bbbSettings = app(BigBlueButtonSettings::class);
        $this->assertEquals('https://example.com/bbb-logo.svg', $bbbSettings->logo);
        $this->assertEquals('https://example.com/bbb.css', $bbbSettings->style);
        $this->assertEquals('https://example.com/default.pdf', $bbbSettings->default_presentation);
    }
}
