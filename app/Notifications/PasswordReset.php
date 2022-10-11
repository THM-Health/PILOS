<?php

namespace App\Notifications;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * This class provides the notification for password reset emails.
 *
 * @package App\Notifications
 */
class PasswordReset extends Notification
{
    use Queueable;

    /**
     * The password reset token.
     *
     * @var string
     */
    private $token;

    /**
     * The date when the password will expire.
     *
     * @var Carbon
     */
    private $expireDate;

    /**
     * Create a new notification instance.
     *
     * @param string $token
     * @param Carbon $expireDate
     */
    public function __construct(string $token, Carbon $expireDate)
    {
        $this->token      = $token;
        $this->expireDate = $expireDate;
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
        $url = url('/reset_password?') . \Arr::query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset()
        ]);

        $date = $this->expireDate
            ->addMinutes(config('auth.passwords.users.expire'))
            ->timezone($notifiable->timezone)
            ->isoFormat('LLLL');

        return (new MailMessage)
            ->subject(__('mail.password_reset.subject'))
            ->line(__('mail.password_reset.description'))
            ->action(__('mail.password_reset.action'), $url)
            ->line(__('mail.password_reset.expire', ['date' => $date]))
            ->line(__('mail.password_reset.signature'))
            ->markdown('vendor.notifications.email', ['name' => $notifiable->fullname]);
    }
}
