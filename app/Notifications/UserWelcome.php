<?php

namespace App\Notifications;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;

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

        $locale = Carbon::getLocale();
        Carbon::setLocale($notifiable->locale);
        $date = $this->expireDate
            ->addMinutes(config('auth.passwords.new_users.expire'))
            ->timezone($notifiable->timezone)
            ->isoFormat('LLLL');
        Carbon::setLocale($locale);

        return (new MailMessage)
            ->subject(Lang::get('mail.user_welcome.subject', [], $notifiable->locale))
            ->line(Lang::get('mail.user_welcome.description', [], $notifiable->locale))
            ->action(Lang::get('mail.user_welcome.action', [], $notifiable->locale), $url)
            ->line(Lang::get('mail.user_welcome.expire', ['date' => $date], $notifiable->locale))
            ->markdown('vendor.notifications.email', ['notifiable' => $notifiable]);
    }
}
