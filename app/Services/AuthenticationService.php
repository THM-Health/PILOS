<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\PasswordChanged;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthenticationService
{
    private User $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    /**
     * @return string
     */
    public function sendResetLink(): string
    {
        return Password::broker('users')->sendResetLink([
            'authenticator' => 'users',
            'email'         => $this->user->email
        ]);
    }

    /**
     * @param  string      $newPassword
     * @param  string|null $session     Session to keep alive
     * @return void
     */
    public function changePassword(string $newPassword, string $session = null)
    {
        $this->user->password = Hash::make($newPassword);
        $this->user->setRememberToken(Str::random(60));
        $this->user->save();

        event(new PasswordReset($this->user));

        $this->user->notify(new PasswordChanged());

        // If session id provided, keep session alive, otherwise logout all sessions of the user
        if ($session) {
            $this->logoutOtherSessions($session);
        } else {
            $this->logoutAllSessions();
        }
    }

    public function logoutOtherSessions(string $currentSession)
    {
        // Not using logoutOtherDevices() because it doesn't work with third party auth providers (would require the users password)
        $this->user->sessions()->whereNot('id', $currentSession)->delete();
    }

    public function logoutAllSessions()
    {
        $this->user->sessions()->delete();
    }
}
