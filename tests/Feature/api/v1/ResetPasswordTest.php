<?php

namespace Tests\Feature\api\v1;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class ResetPasswordTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function testResetPassword()
    {
        setting(['password_self_reset_enabled' => true]);
        $user    = User::factory()->create();
        $newUser = User::factory()->create([
            'initial_password_set' => true
        ]);
        $newUserToken = Password::createToken($newUser);

        $this->actingAs($user)->postJson(route('api.v1.password.reset'))
            ->assertStatus(420);

        Auth::logout();
        Notification::fake();
        $this->postJson(route('api.v1.password.email'), ['email' => $user->email])
            ->assertStatus(200);
        $token = '';
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use (&$token) {
            $token = $notification->token;

            return true;
        });

        $this->postJson(route('api.v1.password.reset'))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['token', 'email', 'password']);

        $this->postJson(route('api.v1.password.reset'), [
            'token'                 => 'foo',
            'email'                 => 'bar',
            'password'              => 'bar',
            'password_confirmation' => 'bar'
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);

        $this->postJson(route('api.v1.password.reset'), [
            'token'                 => 'foo',
            'email'                 => 'foo@bar.de',
            'password'              => 'bar_T123',
            'password_confirmation' => 'bar_T123'
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $this->postJson(route('api.v1.password.reset'), [
            'token'                 => 'foo',
            'email'                 => $newUser->email,
            'password'              => 'bar_T123',
            'password_confirmation' => 'bar_T123'
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $this->postJson(route('api.v1.password.reset'), [
            'token'                 => 'foo',
            'email'                 => $user->email,
            'password'              => 'bar_T123',
            'password_confirmation' => 'bar_T123'
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $this->postJson(route('api.v1.password.reset'), [
            'token'                 => $token,
            'email'                 => $user->email,
            'password'              => 'bar_T123',
            'password_confirmation' => 'bar_T123'
        ])
            ->assertStatus(429);

        $this->artisan('cache:clear');
        $this->postJson(route('api.v1.password.reset'), [
            'token'                 => $token,
            'email'                 => $user->email,
            'password'              => 'bar_T123',
            'password_confirmation' => 'bar_T123'
        ])
            ->assertStatus(200);
        $this->assertAuthenticatedAs($user);
        Auth::logout();

        $this->postJson(route('api.v1.password.reset'), [
            'token'                 => $newUserToken,
            'email'                 => $newUser->email,
            'password'              => 'bar_T123',
            'password_confirmation' => 'bar_T123'
        ])
            ->assertStatus(200);
        $this->assertAuthenticatedAs($newUser);
        Auth::logout();
    }
}
