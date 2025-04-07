<?php

namespace Tests\Backend\Feature\api\v1;

use App\Models\Session;
use App\Models\User;
use App\Notifications\PasswordReset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\Backend\TestCase;

class ResetPasswordTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'auth.local.enabled' => true,
        ]);
    }

    public function test_reset_password()
    {
        $this->userSettings->password_change_allowed = true;
        $this->userSettings->save();
        $user = User::factory()->create();
        $newUser = User::factory()->create([
            'initial_password_set' => true,
        ]);
        $newUserToken = Password::createToken($newUser);

        $this->actingAs($user)->postJson(route('api.v1.password.reset'))
            ->assertStatus(420);

        Auth::logout();
        Notification::fake();
        $this->postJson(route('api.v1.password.email'), ['email' => $user->email])
            ->assertStatus(200);

        $resetUrl = '';
        Notification::assertSentTo($user, function (PasswordReset $notification, $channels, $notifiable) use (&$resetUrl) {
            $resetUrl = $notification->getActionUrl($notifiable);

            return true;
        });
        $query = [];
        parse_str(parse_url($resetUrl, PHP_URL_QUERY), $query);

        $this->postJson(route('api.v1.password.reset'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['token', 'email', 'password']);

        $this->postJson(route('api.v1.password.reset'), [
            'token' => 'foo',
            'email' => 'bar',
            'password' => 'bar',
            'password_confirmation' => 'bar',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);

        $this->postJson(route('api.v1.password.reset'), [
            'token' => 'foo',
            'email' => 'foo@bar.de',
            'password' => 'bar_T123',
            'password_confirmation' => 'bar_T123',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->postJson(route('api.v1.password.reset'), [
            'token' => 'foo',
            'email' => $newUser->email,
            'password' => 'bar_T123',
            'password_confirmation' => 'bar_T123',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->postJson(route('api.v1.password.reset'), [
            'token' => 'foo',
            'email' => $query['email'],
            'password' => 'bar_T123',
            'password_confirmation' => 'bar_T123',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->postJson(route('api.v1.password.reset'), [
            'token' => $query['token'],
            'email' => $query['email'],
            'password' => 'bar_T123',
            'password_confirmation' => 'bar_T123',
        ])
            ->assertStatus(429);

        $this->artisan('cache:clear');
        $this->postJson(route('api.v1.password.reset'), [
            'token' => $query['token'],
            'email' => $query['email'],
            'password' => 'bar_T123',
            'password_confirmation' => 'bar_T123',
        ])
            ->assertStatus(200);
        $this->assertAuthenticatedAs($user);
        Auth::logout();

        // Create sessions in database
        $this->session = new Session;
        $this->session->id = \Str::random(40);
        $this->session->user_agent = 'Agent 1';
        $this->session->ip_address = $this->faker->ipv4;
        $this->session->payload = '';
        $this->session->last_activity = now();
        $this->session->user()->associate($newUser);
        $this->session->save();

        $this->otherSession = new Session;
        $this->otherSession->id = \Str::random(40);
        $this->otherSession->user_agent = 'Agent 2';
        $this->otherSession->ip_address = $this->faker->ipv4;
        $this->otherSession->payload = '';
        $this->otherSession->last_activity = now()->subMinutes(5);
        $this->otherSession->user()->associate($newUser);
        $this->otherSession->save();

        $this->otherUserSession = new Session;
        $this->otherUserSession->id = \Str::random(40);
        $this->otherUserSession->user_agent = 'Agent 3';
        $this->otherUserSession->ip_address = $this->faker->ipv4;
        $this->otherUserSession->payload = '';
        $this->otherUserSession->last_activity = now()->subMinutes(5);
        $this->otherUserSession->user()->associate($user);
        $this->otherUserSession->save();

        $this->postJson(route('api.v1.password.reset'), [
            'token' => $newUserToken,
            'email' => $newUser->email,
            'password' => 'bar_T123',
            'password_confirmation' => 'bar_T123',
        ])
            ->assertStatus(200);
        $this->assertAuthenticatedAs($newUser);
        Auth::logout();

        // Check if all sessions of the user (newUser) are terminated due to password reset, and  sessions of other users are still there
        $this->assertCount(0, $newUser->sessions);
        $this->assertCount(1, $user->sessions);
    }

    public function test_disabled_route()
    {
        $user = User::factory()->create();

        // Check if the route is disabled when the password self reset is disabled
        $this->userSettings->password_change_allowed = false;
        $this->userSettings->save();
        $this->postJson(route('api.v1.password.email'), ['email' => $user->email])
            ->assertNotFound();
        $this->userSettings->password_change_allowed = true;
        $this->userSettings->save();

        // Check if the route is disabled when the local provider is disabled
        config([
            'auth.local.enabled' => false,
        ]);
        $this->postJson(route('api.v1.password.email'), ['email' => $user->email])
            ->assertNotFound();
    }
}
