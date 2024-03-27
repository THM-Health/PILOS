<?php

namespace Tests\Unit\Console;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ImportDatabaseTest extends TestCase
{
    use DatabaseMigrations, WithFaker;

    /**
     * Test importing missing file
     *
     * @return void
     */
    public function testMissingFile()
    {
        // Drop all tables
        $this->artisan('db:wipe');

        // Try to import missing sql file
        $this->artisan('db:import test')
            ->expectsOutput('File not found')
            ->assertExitCode(1);

        // Restore database
        $this->artisan('migrate:fresh');
    }

    /**
     * Test importing invalid file
     *
     * @return void
     */
    public function testInvalidFile()
    {
        // Drop all tables
        $this->artisan('db:wipe');

        // Try to import invalid sql file
        $file = base_path('tests/Fixtures/invalidDatabase.sql');
        $this->artisan('db:import', ['file' => $file])
            ->expectsOutput('Importing database, this may take a while')
            ->expectsOutput('Import failed')
            ->assertExitCode(1);

        // Check if database is empty
        $tables = Arr::pluck(Schema::getTables(), 'name');
        $this->assertCount(0, $tables);

        // Restore database
        $this->artisan('migrate:fresh');
    }

    /**
     * Test importing valid file
     *
     * @return void
     */
    public function testValidFile()
    {
        // Drop all tables
        $this->artisan('db:wipe');

        // Try to import valid sql file
        $file = base_path('tests/Fixtures/validDatabase.sql');
        $this->artisan('db:import', ['file' => $file])
            ->expectsOutput('Importing database, this may take a while')
            ->expectsOutput('Import complete')
            ->assertExitCode(0);

        // Check if migration was successful
        $tables = Arr::pluck(Schema::getTables(), 'name');
        $this->assertCount(1, $tables);
        $this->assertEquals('test', $tables[0]);

        // Restore database
        $this->artisan('migrate:fresh');
    }
}
