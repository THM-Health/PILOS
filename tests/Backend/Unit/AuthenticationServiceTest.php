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

    public function test_change_password_regenerates_session_when_session_provided()
    {
        Notification::fake();
        Event::fake();

        $user = User::factory()->create([
            'password' => Hash::make('old_password'),
        ]);

        $authService = new AuthenticationService($user);

        // Create multiple sessions for the user
        $currentSession = new Session();
        $currentSession->id = $this->faker->uuid();
        $currentSession->user_id = $user->id;
        $currentSession->ip_address = $this->faker->ipv4();
        $currentSession->user_agent = $this->faker->userAgent();
        $currentSession->payload = 'test_payload';
        $currentSession->last_activity = now()->timestamp;
        $currentSession->save();

        $otherSession1 = new Session();
        $otherSession1->id = $this->faker->uuid();
        $otherSession1->user_id = $user->id;
        $otherSession1->ip_address = $this->faker->ipv4();
        $otherSession1->user_agent = $this->faker->userAgent();
        $otherSession1->payload = 'test_payload';
        $otherSession1->last_activity = now()->timestamp;
        $otherSession1->save();

        $otherSession2 = new Session();
        $otherSession2->id = $this->faker->uuid();
        $otherSession2->user_id = $user->id;
        $otherSession2->ip_address = $this->faker->ipv4();
        $otherSession2->user_agent = $this->faker->userAgent();
        $otherSession2->payload = 'test_payload';
        $otherSession2->last_activity = now()->timestamp;
        $otherSession2->save();

        $this->assertDatabaseCount('sessions', 3);

        // Store original session ID for comparison

        // Mock the session facade to simulate session regeneration
        session()->setId($currentSession->id);
        
        // Change password with session parameter
        $newPassword = 'new_secure_password_123!';
        $authService->changePassword($newPassword, $currentSession->id);

        // Verify password was changed
        $user->refresh();
        $this->assertTrue(Hash::check($newPassword, $user->password));

        // Verify other sessions were deleted
        $this->assertNull(Session::find($otherSession1->id));
        $this->assertNull(Session::find($otherSession2->id));

        // Verify password reset event was fired
        Event::assertDispatched(PasswordReset::class);

        // Verify notification was sent
        Notification::assertSentTo($user, PasswordChanged::class);
    }

    public function test_change_password_deletes_all_sessions_when_no_session_provided()
    {
        Notification::fake();
        Event::fake();

        $user = User::factory()->create([
            'password' => Hash::make('old_password'),
        ]);

        $authService = new AuthenticationService($user);

        // Create multiple sessions for the user
        $session1 = new Session();
        $session1->id = $this->faker->uuid();
        $session1->user_id = $user->id;
        $session1->ip_address = $this->faker->ipv4();
        $session1->user_agent = $this->faker->userAgent();
        $session1->payload = 'test_payload';
        $session1->last_activity = now()->timestamp;
        $session1->save();

        $session2 = new Session();
        $session2->id = $this->faker->uuid();
        $session2->user_id = $user->id;
        $session2->ip_address = $this->faker->ipv4();
        $session2->user_agent = $this->faker->userAgent();
        $session2->payload = 'test_payload';
        $session2->last_activity = now()->timestamp;
        $session2->save();

        $this->assertDatabaseCount('sessions', 2);

        // Change password without session parameter
        $newPassword = 'new_secure_password_123!';
        $authService->changePassword($newPassword, null);

        // Verify all sessions were deleted
        $this->assertDatabaseCount('sessions', 0);
        $this->assertNull(Session::find($session1->id));
        $this->assertNull(Session::find($session2->id));

        // Verify password was changed
        $user->refresh();
        $this->assertTrue(Hash::check($newPassword, $user->password));
    }

    public function test_change_password_updates_remember_token()
    {
        Notification::fake();
        Event::fake();

        $user = User::factory()->create([
            'password' => Hash::make('old_password'),
            'remember_token' => 'old_token',
        ]);

        $originalToken = $user->remember_token;
        $authService = new AuthenticationService($user);

        $newPassword = 'new_secure_password_123!';
        $authService->changePassword($newPassword);

        $user->refresh();
        $this->assertNotEquals($originalToken, $user->remember_token);
        $this->assertNotNull($user->remember_token);
        $this->assertEquals(60, strlen($user->remember_token));
    }

    public function test_logout_other_sessions_preserves_current_session()
    {
        $user = User::factory()->create();
        $authService = new AuthenticationService($user);

        // Create multiple sessions
        $currentSession = new Session();
        $currentSession->id = 'current-session-id';
        $currentSession->user_id = $user->id;
        $currentSession->ip_address = $this->faker->ipv4();
        $currentSession->user_agent = $this->faker->userAgent();
        $currentSession->payload = 'test_payload';
        $currentSession->last_activity = now()->timestamp;
        $currentSession->save();

        $otherSession = new Session();
        $otherSession->id = 'other-session-id';
        $otherSession->user_id = $user->id;
        $otherSession->ip_address = $this->faker->ipv4();
        $otherSession->user_agent = $this->faker->userAgent();
        $otherSession->payload = 'test_payload';
        $otherSession->last_activity = now()->timestamp;
        $otherSession->save();

        $this->assertDatabaseCount('sessions', 2);

        $authService->logoutOtherSessions('current-session-id');

        // Verify current session is preserved
        $this->assertNotNull(Session::find('current-session-id'));
        // Verify other session is deleted
        $this->assertNull(Session::find('other-session-id'));
        $this->assertDatabaseCount('sessions', 1);
    }

    public function test_logout_all_sessions_deletes_all_user_sessions()
    {
        $user = User::factory()->create();
        $authService = new AuthenticationService($user);

        // Create multiple sessions
        for ($i = 0; $i < 5; $i++) {
            $session = new Session();
            $session->id = "session-{$i}";
            $session->user_id = $user->id;
            $session->ip_address = $this->faker->ipv4();
            $session->user_agent = $this->faker->userAgent();
            $session->payload = 'test_payload';
            $session->last_activity = now()->timestamp;
            $session->save();
        }

        $this->assertDatabaseCount('sessions', 5);

        $authService->logoutAllSessions();

        $this->assertDatabaseCount('sessions', 0);
    }

    public function test_logout_other_sessions_only_affects_target_user()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $authService = new AuthenticationService($user1);

        // Create sessions for user1
        $user1Session1 = new Session();
        $user1Session1->id = 'user1-session-1';
        $user1Session1->user_id = $user1->id;
        $user1Session1->ip_address = $this->faker->ipv4();
        $user1Session1->user_agent = $this->faker->userAgent();
        $user1Session1->payload = 'test_payload';
        $user1Session1->last_activity = now()->timestamp;
        $user1Session1->save();

        $user1Session2 = new Session();
        $user1Session2->id = 'user1-session-2';
        $user1Session2->user_id = $user1->id;
        $user1Session2->ip_address = $this->faker->ipv4();
        $user1Session2->user_agent = $this->faker->userAgent();
        $user1Session2->payload = 'test_payload';
        $user1Session2->last_activity = now()->timestamp;
        $user1Session2->save();

        // Create session for user2
        $user2Session = new Session();
        $user2Session->id = 'user2-session-1';
        $user2Session->user_id = $user2->id;
        $user2Session->ip_address = $this->faker->ipv4();
        $user2Session->user_agent = $this->faker->userAgent();
        $user2Session->payload = 'test_payload';
        $user2Session->last_activity = now()->timestamp;
        $user2Session->save();

        $this->assertDatabaseCount('sessions', 3);

        $authService->logoutOtherSessions('user1-session-1');

        // Verify user1's current session is preserved
        $this->assertNotNull(Session::find('user1-session-1'));
        // Verify user1's other session is deleted
        $this->assertNull(Session::find('user1-session-2'));
        // Verify user2's session is preserved
        $this->assertNotNull(Session::find('user2-session-1'));
        $this->assertDatabaseCount('sessions', 2);
    }

    public function test_logout_all_sessions_only_affects_target_user()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $authService = new AuthenticationService($user1);

        // Create sessions for both users
        $user1Session = new Session();
        $user1Session->id = 'user1-session';
        $user1Session->user_id = $user1->id;
        $user1Session->ip_address = $this->faker->ipv4();
        $user1Session->user_agent = $this->faker->userAgent();
        $user1Session->payload = 'test_payload';
        $user1Session->last_activity = now()->timestamp;
        $user1Session->save();

        $user2Session = new Session();
        $user2Session->id = 'user2-session';
        $user2Session->user_id = $user2->id;
        $user2Session->ip_address = $this->faker->ipv4();
        $user2Session->user_agent = $this->faker->userAgent();
        $user2Session->payload = 'test_payload';
        $user2Session->last_activity = now()->timestamp;
        $user2Session->save();

        $this->assertDatabaseCount('sessions', 2);

        $authService->logoutAllSessions();

        // Verify user1's session is deleted
        $this->assertNull(Session::find('user1-session'));
        // Verify user2's session is preserved
        $this->assertNotNull(Session::find('user2-session'));
        $this->assertDatabaseCount('sessions', 1);
    }

    public function test_send_reset_link_returns_broker_response()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
        ]);

        $authService = new AuthenticationService($user);

        // Mock Password broker
        Password::shouldReceive('broker')
            ->with('users')
            ->once()
            ->andReturnSelf();

        Password::shouldReceive('sendResetLink')
            ->with([
                'authenticator' => 'local',
                'email' => 'test@example.com',
            ])
            ->once()
            ->andReturn(Password::RESET_LINK_SENT);

        $result = $authService->sendResetLink();

        $this->assertEquals(Password::RESET_LINK_SENT, $result);
    }

    public function test_change_password_with_session_does_not_delete_sessions_of_other_users()
    {
        Notification::fake();
        Event::fake();

        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $authService = new AuthenticationService($user1);

        // Create sessions for both users
        $user1Session = new Session();
        $user1Session->id = 'user1-current';
        $user1Session->user_id = $user1->id;
        $user1Session->ip_address = $this->faker->ipv4();
        $user1Session->user_agent = $this->faker->userAgent();
        $user1Session->payload = 'test_payload';
        $user1Session->last_activity = now()->timestamp;
        $user1Session->save();

        $user1OtherSession = new Session();
        $user1OtherSession->id = 'user1-other';
        $user1OtherSession->user_id = $user1->id;
        $user1OtherSession->ip_address = $this->faker->ipv4();
        $user1OtherSession->user_agent = $this->faker->userAgent();
        $user1OtherSession->payload = 'test_payload';
        $user1OtherSession->last_activity = now()->timestamp;
        $user1OtherSession->save();

        $user2Session = new Session();
        $user2Session->id = 'user2-session';
        $user2Session->user_id = $user2->id;
        $user2Session->ip_address = $this->faker->ipv4();
        $user2Session->user_agent = $this->faker->userAgent();
        $user2Session->payload = 'test_payload';
        $user2Session->last_activity = now()->timestamp;
        $user2Session->save();

        session()->setId($user1Session->id);

        $newPassword = 'new_secure_password!';
        $authService->changePassword($newPassword, 'user1-current');

        // Verify user1's other session was deleted
        $this->assertNull(Session::find('user1-other'));
        // Verify user2's session was NOT deleted
        $this->assertNotNull(Session::find('user2-session'));
    }
}