<?php

namespace Tests\Backend\Feature\api\v1;

use App\Models\User;
use App\Notifications\PasswordReset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Tests\Backend\TestCase;

class ForgotPasswordTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'auth.local.enabled' => true,
        ]);
    }

    public function test_disabled_route()
    {
        // Check if the route is disabled when the password self reset is disabled
        config([
            'auth.local.enabled' => true,
        ]);
        $this->userSettings->password_change_allowed = false;
        $this->userSettings->save();
        $this->postJson(route('api.v1.password.email'), [
            'email' => 'test@test.de',
        ])->assertNotFound();

        // Check if the route is disabled when the local provider is disabled
        config([
            'auth.local.enabled' => false,
        ]);
        $this->userSettings->password_change_allowed = true;
        $this->userSettings->save();
        $this->postJson(route('api.v1.password.email'), [
            'email' => 'test@test.de',
        ])->assertNotFound();
    }

    public function test_forgot_password()
    {
        $user = User::factory()->create();
        $externalUser = User::factory()->create([
            'authenticator' => 'ldap',
        ]);
        $newUser = User::factory()->create([
            'initial_password_set' => true,
        ]);

        $this->userSettings->password_change_allowed = true;
        $this->userSettings->save();
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
        $this->postJson(route('api.v1.password.email'), ['email' => $externalUser->email])
            ->assertStatus(200);
        $this->assertDatabaseCount('password_resets', 0);
        Notification::assertNotSentTo($externalUser, PasswordReset::class);

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
