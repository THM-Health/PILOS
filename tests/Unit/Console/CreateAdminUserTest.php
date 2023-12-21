<?php

namespace Tests\Unit\Console;

use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class CreateAdminUserTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * @see TestCase::setUp()
     */
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'app.enabled_locales'   => ['de' => ['name' => 'Deutsch', 'dateTimeFormat' => []], 'en' => ['name' => 'English', 'dateTimeFormat' => []]],
            'app.fallback_locale'   => 'ru',
            'app.locale'            => 'en',
            'auth.local.enabled'    => true
        ]);
    }

    public function testInvalidInputs()
    {
        Role::factory()->create(['name' => 'admin']);

        $this->artisan('users:create:admin')
            ->expectsOutput('Creating an new admin user, please notify your inputs.')
            ->expectsQuestion('Firstname', str_repeat('a', 256))
            ->expectsQuestion('Lastname', str_repeat('a', 256))
            ->expectsQuestion('E-Mail', str_repeat('a', 256))
            ->expectsQuestion('Locale (possible values: ' . join(',', array_keys(config('app.enabled_locales'))) . ')', str_repeat('a', 256))
            ->expectsQuestion('Password', 'Test')
            ->expectsQuestion('Password Confirmation', 'Test1234')
            ->expectsOutput('Something went wrong, please see the error messages below for more information.')
            ->assertExitCode(1);
    }

    public function testMissingRole()
    {
        $this->artisan('users:create:admin')
            ->expectsOutput('The admin role does not exist. Please seed the database and then retry!')
            ->assertExitCode(1);
    }

    public function testValidInputs()
    {
        Role::factory()->create(['name' => 'admin']);

        $this->artisan('users:create:admin')
            ->expectsOutput('Creating an new admin user, please notify your inputs.')
            ->expectsQuestion('Firstname', $this->faker->firstName)
            ->expectsQuestion('Lastname', $this->faker->lastName)
            ->expectsQuestion('E-Mail', $this->faker->email)
            ->expectsQuestion('Locale (possible values: ' . join(',', array_keys(config('app.enabled_locales'))) . ')', array_keys(config('app.enabled_locales'))[0])
            ->expectsQuestion('Password', 'Test_1234')
            ->expectsQuestion('Password Confirmation', 'Test_1234')
            ->expectsOutput('New admin user created successfully.')
            ->assertExitCode(0);

        $this->assertDatabaseCount('users', 1);
    }

    public function testLocalAuthDisabled()
    {
        config([
            'auth.local.enabled'    => false
        ]);

        $this->artisan('users:create:admin')
            ->expectsOutput('Local login is not enabled. Please enable it in the .env with the option LOCAL_AUTH_ENABLED and then retry!')
            ->assertExitCode(1);
    }
}
