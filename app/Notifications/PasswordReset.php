<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;

class PasswordReset extends Notification
{
    use Queueable;

    /**
     * The password reset token.
     *
     * @var string
     */
    private $token;
    private $expireDate;

    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct($token, $expireDate)
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
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $url = url('/reset_password?') . \Arr::query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset()
        ]);

        return (new MailMessage)
            ->greeting(Lang::get('mail.greeting', ['name' => $notifiable->fullname]))
            ->subject(Lang::get('mail.password_reset.subject'))
            ->line(Lang::get('mail.password_reset.description'))
            ->action(Lang::get('mail.password_reset.action'), $url)
            ->line(Lang::get('mail.password_reset.expire', ['date' => $this->expireDate->isoFormat('LLLL')]))
            ->line(Lang::get('mail.password_reset.signature'));
    }
}
