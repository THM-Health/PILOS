<?php

namespace App\Notifications;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;

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
     * @param  mixed                                          $notifiable
     * @return MailMessage
     */
    public function toMail($notifiable)
    {
        $url = url('/reset_password?') . \Arr::query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset()
        ]);

        return (new MailMessage)
            ->subject(Lang::get('mail.password_reset.subject', [], $notifiable->locale))
            ->line(Lang::get('mail.password_reset.description', [], $notifiable->locale))
            ->action(Lang::get('mail.password_reset.action', [], $notifiable->locale), $url)
            ->line(Lang::get('mail.password_reset.expire', ['date' => $this->expireDate->isoFormat('LLLL')], $notifiable->locale))
            ->line(Lang::get('mail.password_reset.signature', [], $notifiable->locale))
            ->markdown('vendor.notifications.email', ['notifiable' => $notifiable]);
    }
}
