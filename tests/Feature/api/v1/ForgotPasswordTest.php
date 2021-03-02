<?php

namespace Tests\Feature\api\v1;

use App\User;
use Illuminate\Auth\Notifications\ResetPassword;
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
        $user     = factory(User::class)->create();
        $ldapUser = factory(User::class)->create([
            'authenticator' => 'ldap'
        ]);
        $newUser = factory(User::class)->create([
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
        Notification::assertNotSentTo($ldapUser, ResetPassword::class);

        $this->postJson(route('api.v1.password.email'), ['email' => $newUser->email])
            ->assertStatus(200);
        $this->assertDatabaseCount('password_resets', 0);
        Notification::assertNotSentTo($newUser, ResetPassword::class);

        $this->postJson(route('api.v1.password.email'), ['email' => $newUser->email])
            ->assertStatus(200);
        $this->assertDatabaseCount('password_resets', 0);
        Notification::assertNotSentTo($newUser, ResetPassword::class);

        $this->postJson(route('api.v1.password.email'), ['email' => $newUser->email])
            ->assertStatus(429);
        $this->assertDatabaseCount('password_resets', 0);
        Notification::assertNotSentTo($newUser, ResetPassword::class);

        $this->artisan('cache:clear')->assertExitCode(0);
        $this->postJson(route('api.v1.password.email'), ['email' => $user->email])
            ->assertStatus(200);
        $this->assertDatabaseCount('password_resets', 1);
        $old_reset = DB::table('password_resets')->first();
        Notification::assertSentTo($user, ResetPassword::class);

        Notification::fake();
        $this->postJson(route('api.v1.password.email'), ['email' => $user->email])
            ->assertStatus(200);
        $new_reset = DB::table('password_resets')->first();
        $this->assertEquals($old_reset->created_at, $new_reset->created_at);
        $this->assertEquals($old_reset->email, $new_reset->email);
        $this->assertEquals($old_reset->token, $new_reset->token);
        $this->assertDatabaseCount('password_resets', 1);
        Notification::assertNotSentTo($user, ResetPassword::class);
    }
}
