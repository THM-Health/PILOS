<?php

namespace Tests\Unit\Console;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DeleteUnverifiedNewUsersTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * @see TestCase::setUp()
     */
    protected function setUp(): void
    {
        parent::setUp();
    }

    public function testNoUnverifiedUsers()
    {
        $this->artisan('users:delete:unverified')
            ->assertExitCode(0);
    }

    public function testDeletionOfUnverifiedUsersWithTokens()
    {
        // Newly created user with expired token
        User::factory()->create([
            'email'                => 'john@doe.com',
            'initial_password_set' => true,
            'authenticator'        => 'local'
        ]);
        DB::table('password_resets')
            ->insert([
                'token'      => 'foo',
                'email'      => 'john@doe.com',
                'created_at' => Carbon::now()->subMinutes(config('auth.passwords.new_users.expire') + 1)
            ]);

        // LDAP user with same email
        User::factory()->create([
            'email'                => 'john@doe.com',
            'initial_password_set' => true, // accidentally set to true
            'authenticator'        => 'external'
        ]);

        // Registered user with expired password reset token
        User::factory()->create([
            'email'         => 'max@muster.de',
            'authenticator' => 'local'
        ]);
        DB::table('password_resets')
            ->insert([
                'token'      => 'bar',
                'email'      => 'max@muster.de',
                'created_at' => Carbon::now()->subMinutes(config('auth.passwords.new_users.expire') + 1)
            ]);

        $this->assertDatabaseCount('password_resets', 2);
        $this->assertDatabaseCount('users', 3);
        $this->artisan('users:delete:unverified')
            ->assertExitCode(0);
        $this->assertDatabaseCount('password_resets', 1);
        $this->assertDatabaseCount('users', 2);
    }
}
