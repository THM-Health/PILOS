<?php

namespace App\Notifications;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * This class provides the notification for newly created users with generated passwords.
 */
class UserWelcome extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        /**
         * The password reset token.
         */
        private string $token,
        /**
         * The date when the password will expire.
         */
        private Carbon $expireDate
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return MailMessage
     */
    public function toMail($notifiable)
    {
        $url = url('/reset_password?').\Arr::query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
            'welcome' => true,
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
