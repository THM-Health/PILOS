<?php

namespace Tests\Unit\Console;

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
        $migrations_v1 = DB::table('migrations')->pluck('migration')->toArray();

        // Upgrade to v2 database
        $this->artisan('db:upgrade')
            ->expectsOutput('Upgraded to latest v2 database')
            ->expectsOutput('Upgraded to v4 database')
            ->expectsOutput('Cleared old migrations table')
            ->expectsOutput('Created new migrations table')
            ->expectsOutputToContain('Upgrade to v4 completed. Please upgrade to latest v4 database: php artisan migrate');

        $migrations_upgrade = DB::table('migrations')->pluck('migration')->toArray();

        // Check migration table was rewritten
        $this->assertNotEqualsCanonicalizing($migrations_upgrade, $migrations_v1);

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
}
