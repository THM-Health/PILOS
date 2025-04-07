<?php

namespace Tests\Backend\Unit\Console;

use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

class CreateSuperuserTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * @see TestCase::setUp()
     */
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'app.enabled_locales' => ['de' => ['name' => 'Deutsch', 'dateTimeFormat' => []], 'en' => ['name' => 'English', 'dateTimeFormat' => []]],
            'app.locale' => 'en',
            'auth.local.enabled' => true,
        ]);
    }

    public function test_missing_role()
    {
        Role::factory()->create(['name' => 'superuser']);

        $this->artisan('users:create:superuser')
            ->expectsOutput('The superuser role does not exist. Please seed the database and then retry!')
            ->assertExitCode(1);
    }

    public function test_valid_inputs()
    {
        Role::factory()->create(['name' => 'superuser', 'superuser' => true]);

        $this->artisan('users:create:superuser')
            ->expectsOutput('Creating an new superuser, please notify your inputs.')
            ->expectsQuestion('Firstname', $this->faker->firstName)
            ->expectsQuestion('Lastname', $this->faker->lastName)
            ->expectsQuestion('E-Mail', $this->faker->email)
            ->expectsQuestion('Locale', array_keys(config('app.enabled_locales'))[0])
            ->expectsQuestion('Password', 'Test_1234')
            ->expectsOutput('New superuser created successfully.')
            ->assertExitCode(0);

        $this->assertDatabaseCount('users', 1);
    }

    public function test_local_auth_disabled()
    {
        config([
            'auth.local.enabled' => false,
        ]);

        $this->artisan('users:create:superuser')
            ->expectsOutput('Local login is not enabled. Please enable it in the .env with the option LOCAL_AUTH_ENABLED and then retry!')
            ->assertExitCode(1);
    }
}
