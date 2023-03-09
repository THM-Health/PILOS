<?php

namespace App\Notifications;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * This class provides the notification for newly created users with generated passwords.
 *
 * @package App\Notifications
 */
class UserWelcome extends Notification
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
    public function toMail($notifiable)
    {
        $url = url('/reset_password?') . \Arr::query([
            'token'   => $this->token,
            'email'   => $notifiable->getEmailForPasswordReset(),
            'welcome' => true
        ]);

        $date = $this->expireDate
            ->addMinutes(config('auth.passwords.new_users.expire'))
            ->timezone($notifiable->timezone)
            ->isoFormat('LLLL');

        return (new MailMessage)
            ->subject(__('mail.user_welcome.subject'))
            ->line(__('mail.user_welcome.description'))
            ->action(__('mail.user_welcome.action'), $url)
            ->line(__('mail.user_welcome.expire', ['date' => $date]))
            ->markdown('vendor.notifications.email', ['name' => $notifiable->fullname]);
    }
}
