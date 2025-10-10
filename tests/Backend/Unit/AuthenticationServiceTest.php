<?php

namespace Tests\Backend\Unit;

use App\Models\Session;
use App\Models\User;
use App\Notifications\PasswordChanged;
use App\Services\AuthenticationService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\Backend\TestCase;

class AuthenticationServiceTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;

    protected AuthenticationService $authService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'password' => Hash::make('oldpassword123'),
        ]);
        $this->authService = new AuthenticationService($this->user);
    }

    public function test_send_reset_link_calls_password_broker()
    {
        Password::shouldReceive('broker')
            ->once()
            ->with('users')
            ->andReturnSelf();

        Password::shouldReceive('sendResetLink')
            ->once()
            ->with([
                'authenticator' => 'local',
                'email' => $this->user->email,
            ])
            ->andReturn(Password::RESET_LINK_SENT);

        $result = $this->authService->sendResetLink();

        $this->assertEquals(Password::RESET_LINK_SENT, $result);
    }

    public function test_change_password_updates_user_password()
    {
        $newPassword = 'newSecurePassword123!';

        Notification::fake();
        Event::fake();

        $this->authService->changePassword($newPassword);

        $this->user->refresh();
        $this->assertTrue(Hash::check($newPassword, $this->user->password));
    }

    public function test_change_password_updates_remember_token()
    {
        $oldToken = $this->user->remember_token;

        Notification::fake();
        Event::fake();

        $this->authService->changePassword('newPassword123!');

        $this->user->refresh();
        $this->assertNotEquals($oldToken, $this->user->remember_token);
        $this->assertNotNull($this->user->remember_token);
        $this->assertEquals(60, strlen($this->user->remember_token));
    }

    public function test_change_password_triggers_password_reset_event()
    {
        Event::fake();
        Notification::fake();

        $this->authService->changePassword('newPassword123!');

        Event::assertDispatched(PasswordReset::class, function ($event) {
            return $event->user->id === $this->user->id;
        });
    }

    public function test_change_password_sends_notification()
    {
        Notification::fake();
        Event::fake();

        $this->authService->changePassword('newPassword123!');

        Notification::assertSentTo(
            [$this->user],
            PasswordChanged::class
        );
    }

    public function test_change_password_without_session_deletes_all_sessions()
    {
        Event::fake();
        Notification::fake();

        // Create multiple sessions for the user
        Session::factory()->create(['user_id' => $this->user->id]);
        Session::factory()->create(['user_id' => $this->user->id]);
        Session::factory()->create(['user_id' => $this->user->id]);

        $this->assertEquals(3, $this->user->sessions()->count());

        $this->authService->changePassword('newPassword123!', null);

        $this->assertEquals(0, $this->user->sessions()->count());
    }

    public function test_change_password_with_session_keeps_specified_session()
    {
        Event::fake();
        Notification::fake();

        // Create multiple sessions for the user
        $session1 = Session::factory()->create(['user_id' => $this->user->id]);
        $session2 = Session::factory()->create(['user_id' => $this->user->id]);
        $session3 = Session::factory()->create(['user_id' => $this->user->id]);

        $this->assertEquals(3, $this->user->sessions()->count());

        // Mock session regeneration
        $this->app->instance('session', \Mockery::mock(\Illuminate\Session\SessionManager::class, function ($mock) {
            $mock->shouldReceive('regenerate')
                ->once()
                ->with(true)
                ->andReturn(true);
        }));

        $this->authService->changePassword('newPassword123!', $session2->id);

        // Only the specified session should remain
        $this->assertEquals(1, $this->user->sessions()->count());
        $this->assertTrue($this->user->sessions()->where('id', $session2->id)->exists());
        $this->assertFalse($this->user->sessions()->where('id', $session1->id)->exists());
        $this->assertFalse($this->user->sessions()->where('id', $session3->id)->exists());
    }

    public function test_change_password_with_session_regenerates_session()
    {
        Event::fake();
        Notification::fake();

        $session = Session::factory()->create(['user_id' => $this->user->id]);

        $sessionMock = \Mockery::mock(\Illuminate\Session\SessionManager::class);
        $sessionMock->shouldReceive('regenerate')
            ->once()
            ->with(true)
            ->andReturn(true);

        $this->app->instance('session', $sessionMock);

        $this->authService->changePassword('newPassword123!', $session->id);

        // Verify the mock was called
        $sessionMock->shouldHaveReceived('regenerate')->once();
    }

    public function test_logout_other_sessions_deletes_other_sessions_only()
    {
        Session::factory()->create(['user_id' => $this->user->id]);
        $session2 = Session::factory()->create(['user_id' => $this->user->id]);
        Session::factory()->create(['user_id' => $this->user->id]);

        $this->assertEquals(3, $this->user->sessions()->count());

        $this->authService->logoutOtherSessions($session2->id);

        $this->assertEquals(1, $this->user->sessions()->count());
        $this->assertTrue($this->user->sessions()->where('id', $session2->id)->exists());
    }

    public function test_logout_other_sessions_does_not_affect_other_users()
    {
        $otherUser = User::factory()->create();

        $userSession1 = Session::factory()->create(['user_id' => $this->user->id]);
        Session::factory()->create(['user_id' => $this->user->id]);
        $otherUserSession = Session::factory()->create(['user_id' => $otherUser->id]);

        $this->authService->logoutOtherSessions($userSession1->id);

        // Other user's session should remain
        $this->assertTrue(Session::where('id', $otherUserSession->id)->exists());
        $this->assertEquals(1, $otherUser->sessions()->count());
    }

    public function test_logout_all_sessions_deletes_all_user_sessions()
    {
        Session::factory()->create(['user_id' => $this->user->id]);
        Session::factory()->create(['user_id' => $this->user->id]);
        Session::factory()->create(['user_id' => $this->user->id]);

        $this->assertEquals(3, $this->user->sessions()->count());

        $this->authService->logoutAllSessions();

        $this->assertEquals(0, $this->user->sessions()->count());
    }

    public function test_logout_all_sessions_does_not_affect_other_users()
    {
        $otherUser = User::factory()->create();

        Session::factory()->create(['user_id' => $this->user->id]);
        Session::factory()->create(['user_id' => $this->user->id]);
        $otherUserSession = Session::factory()->create(['user_id' => $otherUser->id]);

        $this->authService->logoutAllSessions();

        $this->assertEquals(0, $this->user->sessions()->count());
        $this->assertTrue(Session::where('id', $otherUserSession->id)->exists());
    }

    public function test_change_password_with_empty_password_sets_empty_hash()
    {
        Event::fake();
        Notification::fake();

        $this->authService->changePassword('');

        $this->user->refresh();
        $this->assertTrue(Hash::check('', $this->user->password));
    }

    public function test_change_password_with_long_password()
    {
        Event::fake();
        Notification::fake();

        $longPassword = str_repeat('a', 200);

        $this->authService->changePassword($longPassword);

        $this->user->refresh();
        $this->assertTrue(Hash::check($longPassword, $this->user->password));
    }

    public function test_change_password_with_special_characters()
    {
        Event::fake();
        Notification::fake();

        $specialPassword = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';

        $this->authService->changePassword($specialPassword);

        $this->user->refresh();
        $this->assertTrue(Hash::check($specialPassword, $this->user->password));
    }

    public function test_change_password_with_unicode_characters()
    {
        Event::fake();
        Notification::fake();

        $unicodePassword = '密码测试πάσσωορδ';

        $this->authService->changePassword($unicodePassword);

        $this->user->refresh();
        $this->assertTrue(Hash::check($unicodePassword, $this->user->password));
    }

    public function test_multiple_password_changes_in_sequence()
    {
        Event::fake();
        Notification::fake();

        $passwords = ['password1', 'password2', 'password3'];

        foreach ($passwords as $password) {
            $this->authService->changePassword($password);
            $this->user->refresh();
            $this->assertTrue(Hash::check($password, $this->user->password));
        }

        // Should have triggered events for each change
        Event::assertDispatched(PasswordReset::class, 3);
    }

    public function test_change_password_with_nonexistent_session_id()
    {
        Event::fake();
        Notification::fake();

        Session::factory()->create(['user_id' => $this->user->id]);

        $sessionMock = \Mockery::mock(\Illuminate\Session\SessionManager::class);
        $sessionMock->shouldReceive('regenerate')
            ->once()
            ->with(true)
            ->andReturn(true);

        $this->app->instance('session', $sessionMock);

        // Try to keep a session that doesn't exist
        $this->authService->changePassword('newPassword123!', 'nonexistent-session-id');

        // All sessions should be deleted since the specified session doesn't exist
        $this->assertEquals(0, $this->user->sessions()->count());
    }

    public function test_logout_other_sessions_with_only_one_session()
    {
        $session = Session::factory()->create(['user_id' => $this->user->id]);

        $this->authService->logoutOtherSessions($session->id);

        // The only session should remain
        $this->assertEquals(1, $this->user->sessions()->count());
        $this->assertTrue($this->user->sessions()->where('id', $session->id)->exists());
    }

    public function test_logout_all_sessions_when_user_has_no_sessions()
    {
        $this->assertEquals(0, $this->user->sessions()->count());

        $this->authService->logoutAllSessions();

        $this->assertEquals(0, $this->user->sessions()->count());
    }

    public function test_change_password_persists_after_user_refresh()
    {
        Event::fake();
        Notification::fake();

        $newPassword = 'persistedPassword123!';

        $this->authService->changePassword($newPassword);

        // Create a new instance from database
        $freshUser = User::find($this->user->id);

        $this->assertTrue(Hash::check($newPassword, $freshUser->password));
    }

    public function test_authentication_service_constructor_with_different_user()
    {
        $anotherUser = User::factory()->create();
        $anotherAuthService = new AuthenticationService($anotherUser);

        Event::fake();
        Notification::fake();

        $anotherAuthService->changePassword('differentPassword123!');

        $anotherUser->refresh();
        $this->assertTrue(Hash::check('differentPassword123!', $anotherUser->password));

        // Original user should not be affected
        $this->user->refresh();
        $this->assertTrue(Hash::check('oldpassword123', $this->user->password));
    }

    public function test_session_regeneration_called_with_correct_parameter()
    {
        Event::fake();
        Notification::fake();

        $session = Session::factory()->create(['user_id' => $this->user->id]);

        $sessionMock = \Mockery::mock(\Illuminate\Session\SessionManager::class);
        $sessionMock->shouldReceive('regenerate')
            ->once()
            ->with(true)
            ->andReturn(true);

        $this->app->instance('session', $sessionMock);

        $this->authService->changePassword('newPassword123!', $session->id);

        // Verify regenerate was called with true (destroy old session)
        $sessionMock->shouldHaveReceived('regenerate')->with(true);
    }
}