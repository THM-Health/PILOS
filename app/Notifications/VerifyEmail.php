<?php

namespace App\Notifications;

use App\Services\EmailVerification\NewVerifyEmailToken;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmail extends Notification
{
    private NewVerifyEmailToken $token;
    private string $timezone;

    /**
     * @param NewVerifyEmailToken $token
     * @param string              $timezone
     */
    public function __construct(NewVerifyEmailToken $token, string $timezone)
    {
        $this->token    = $token;
        $this->timezone = $timezone;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed       $notifiable
     * @return MailMessage
     */
    public function toMail($notifiable): MailMessage
    {
        $this->expireDateTime = $this->token->getVerifyEmail()->created_at
            ->addMinutes(config('auth.passwords.users.expire'))
            ->timezone($this->timezone)
            ->isoFormat('LLLL');

        $url = url('/verify_email?') . \Arr::query([
                'token' => $this->token->getPlainTextToken(),
            ]);

        return (new MailMessage)
            ->subject(__('mail.verify_email.subject'))
            ->line(__('mail.verify_email.description'))
            ->action(__('mail.verify_email.action'), $url)
            ->line(__('mail.verify_email.expire', ['expireDateTime' => $this->expireDateTime]))
            ->markdown('vendor.notifications.email', ['name' => $this->token->getVerifyEmail()->user->fullname]);
    }
}
