<?php

namespace Tests\Feature\api\v1;

use App\Models\User;
use App\Notifications\PasswordReset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ForgotPasswordTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function testDisabledRoute()
    {
        setting(['password_self_reset_enabled' => false ]);
        $this->postJson(route('api.v1.password.email'), [
            'email' => 'test@test.de'
        ])->assertNotFound();
    }

    public function testForgotPassword()
    {
        $user     = User::factory()->create();
        $ldapUser = User::factory()->create([
            'authenticator' => 'ldap'
        ]);
        $newUser = User::factory()->create([
            'initial_password_set' => true
        ]);

        setting(['password_self_reset_enabled' => true ]);
        $this->actingAs($user)->postJson(route('api.v1.password.email'))
            ->assertStatus(420);

        Auth::logout();
        $this->postJson(route('api.v1.password.email'))
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $this->postJson(route('api.v1.password.email'), ['email' => 'foo'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        Notification::fake();
        $this->postJson(route('api.v1.password.email'), ['email' => $ldapUser->email])
            ->assertStatus(200);
        $this->assertDatabaseCount('password_resets', 0);
        Notification::assertNotSentTo($ldapUser, PasswordReset::class);

        $this->postJson(route('api.v1.password.email'), ['email' => $newUser->email])
            ->assertStatus(200);
        $this->assertDatabaseCount('password_resets', 0);
        Notification::assertNotSentTo($newUser, PasswordReset::class);

        $this->postJson(route('api.v1.password.email'), ['email' => $newUser->email])
            ->assertStatus(200);
        $this->assertDatabaseCount('password_resets', 0);
        Notification::assertNotSentTo($newUser, PasswordReset::class);

        $this->postJson(route('api.v1.password.email'), ['email' => $newUser->email])
            ->assertStatus(429);
        $this->assertDatabaseCount('password_resets', 0);
        Notification::assertNotSentTo($newUser, PasswordReset::class);

        $this->artisan('cache:clear')->assertExitCode(0);
        $this->postJson(route('api.v1.password.email'), ['email' => $user->email])
            ->assertStatus(200);
        $this->assertDatabaseCount('password_resets', 1);
        $old_reset = DB::table('password_resets')->first();

        Notification::assertSentTo($user, PasswordReset::class);

        // Check if requesting a new reset link immediately after the first one is not possible
        Notification::fake();
        $this->postJson(route('api.v1.password.email'), ['email' => $user->email])
            ->assertStatus(200);
        $new_reset = DB::table('password_resets')->first();
        $this->assertEquals($old_reset->created_at, $new_reset->created_at);
        $this->assertEquals($old_reset->email, $new_reset->email);
        $this->assertEquals($old_reset->token, $new_reset->token);
        $this->assertDatabaseCount('password_resets', 1);
        Notification::assertNotSentTo($user, PasswordReset::class);
    }
}
