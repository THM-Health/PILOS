<?php

namespace App\Services\EmailVerification;

use App\Models\VerifyEmail;
use App\Models\User;
use App\Notifications\EmailChanged;
use App\Notifications\VerifyEmail as VerifyEmailNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class EmailVerificationService
{
    private User $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    /**
     * Send the email verification notification.
     */
    public function sendEmailVerificationNotification(string $newEmail): bool
    {
        if ($this->recentlyCreated()) {
            return false;
        }

        $token = $this->createToken($newEmail);

        Notification::route('mail', [
            $newEmail => $this->user->fullname
        ])->notifyNow((new VerifyEmailNotification($token, $this->user->timezone))->locale($this->user->locale));

        return true;
    }

    /**
     * Determine if the given user recently created an email change request.
     *
     * @return bool
     */
    public function recentlyCreated(): bool
    {
        $throttle = config('auth.email_change.throttle');
        if ($throttle <= 0) {
            return false;
        }

        return $this->user->verifyEmails()->where('created_at', '>=', Carbon::now()->subSeconds($throttle))->exists();
    }

    public function processVerification(string $token, string $email): bool
    {
        $emailChange = $this->user->verifyEmails()->where('email', $email)->orderByDesc('created_at')->first();

        if ($emailChange === null) {
            return false;
        }

        if ($emailChange->created_at->addMinutes(config('auth.email_change.expire'))->isPast()) {
            return false;
        }

        if (!Hash::check($token, $emailChange->token)) {
            return false;
        }

        $this->changeEmail($emailChange->email);

        return true;
    }

    public function changeEmail(string $newEmail)
    {
        $oldEmail          = $this->user->email;
        $this->user->email = $newEmail;
        $this->user->save();

        $this->user->verifyEmails()->delete();

        Notification::route('mail', [
            $oldEmail => $this->user->fullname
        ])->notify((new EmailChanged($this->user->email, $this->user->fullname))->locale($this->user->locale));
    }

    /**
     * Create token for email verification.
     */
    protected function createToken(string $newEmail): NewVerifyEmailToken
    {
        // Clear old tokens
        $this->user->verifyEmails()->delete();

        $clearTextToken = Str::random(40);
        $token          = Hash::make($clearTextToken);
        $verifyEmail    = new VerifyEmail();
        $verifyEmail->user()->associate($this->user);
        $verifyEmail->email = $newEmail;
        $verifyEmail->token = $token;
        $verifyEmail->save();

        return new NewVerifyEmailToken($verifyEmail, $clearTextToken);
    }
}
