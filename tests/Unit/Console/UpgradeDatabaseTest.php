<?php

namespace Tests\Unit\Console;

use DB;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class UpgradeDatabaseTest extends TestCase
{
    use WithFaker;

    /**
     * Test upgrade with v1 database
     * @return void
     */
    public function testV1Database()
    {
        // Create fresh v1 database
        $this->artisan('migrate:fresh', ['--path'=>'database/migrations/v1']);
        $migrations_v1 = DB::table('migrations')->pluck('migration')->toArray();

        // Upgrade to v2 database
        $this->artisan('db:upgrade')
            ->expectsOutput('Upgraded to latest v1 database')
            ->expectsOutput('Upgraded to v2 database')
            ->expectsOutput('Cleared old migrations table')
            ->expectsOutput('Created new migrations table')
            ->expectsOutputToContain('Upgrade to v2 completed. Please upgrade to latest v2 database: php artisan migrate');

        $tables_upgrade     = DB::connection()->getDoctrineSchemaManager()->listTableNames();
        $migrations_upgrade = DB::table('migrations')->pluck('migration')->toArray();

        // Check migration table was rewritten
        $this->assertNotEqualsCanonicalizing($migrations_upgrade, $migrations_v1);

        // Check running upgrade again
        $this->artisan('db:upgrade')
            ->expectsOutput('Database is already upgraded');

        // Creat v2 database
        $this->artisan('migrate:fresh');
        $tables_v2     = DB::connection()->getDoctrineSchemaManager()->listTableNames();
        $migrations_v2 = DB::table('migrations')->pluck('migration')->toArray();

        // Check table names and migration table is equal
        $this->assertEqualsCanonicalizing($tables_upgrade, $tables_v2);
        $this->assertEqualsCanonicalizing($migrations_upgrade, $migrations_v2);
    }

    /**
     * Try to run upgrade on v2 database
     * @return void
     */
    public function testV2Database()
    {
        // Create new v2 db
        $this->artisan('migrate:fresh');

        // Try to upgrade
        $this->artisan('db:upgrade')
            ->expectsOutput('Database is already upgraded');
    }

    /**
     * Test update on empty database
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
