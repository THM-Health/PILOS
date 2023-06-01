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
            'app.enabled_locales'   => ['de', 'en'],
            'app.fallback_locale'   => 'ru',
            'app.locale'            => 'en'
        ]);
    }

    /**
     * A basic unit test example.
     *
     * @return void
     */
    public function testInvalidInputs()
    {
        Role::factory()->create(['name' => 'admin']);

        $this->artisan('users:create:admin')
            ->expectsOutput('Creating an new admin user, please notify your inputs.')
            ->expectsQuestion('Firstname', str_repeat('a', 256))
            ->expectsQuestion('Lastname', str_repeat('a', 256))
            ->expectsQuestion('E-Mail', str_repeat('a', 256))
            ->expectsQuestion('Locale (possible values: ' . join(',', config('app.enabled_locales')) . ')', str_repeat('a', 256))
            ->expectsQuestion('Password', 'Test')
            ->expectsQuestion('Password Confirmation', 'Test1234')
            ->expectsConfirmation('Skip audio check on joining rooms?', 'f')
            ->expectsOutput('Something went wrong, please see the error messages below for more information.')
            ->assertExitCode(1);
    }

    /**
     * A basic unit test example.
     *
     * @return void
     */
    public function testMissingRole()
    {
        $this->artisan('users:create:admin')
            ->expectsOutput('The admin role does not exist. Please seed the database and then retry!')
            ->assertExitCode(1);
    }

    /**
     * A basic unit test example.
     *
     * @return void
     */
    public function testValidInputs()
    {
        Role::factory()->create(['name' => 'admin']);

        $this->artisan('users:create:admin')
            ->expectsOutput('Creating an new admin user, please notify your inputs.')
            ->expectsQuestion('Firstname', $this->faker->firstName)
            ->expectsQuestion('Lastname', $this->faker->lastName)
            ->expectsQuestion('E-Mail', $this->faker->email)
            ->expectsQuestion('Locale (possible values: ' . join(',', config('app.enabled_locales')) . ')', config('app.enabled_locales')[0])
            ->expectsQuestion('Password', 'Test_1234')
            ->expectsQuestion('Password Confirmation', 'Test_1234')
            ->expectsOutput('New admin user created successfully.')
            ->expectsConfirmation('Skip audio check on joining rooms?', 'y')
            ->assertExitCode(0);

        $this->assertDatabaseCount('users', 1);
    }
}
