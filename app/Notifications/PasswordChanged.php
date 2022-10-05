<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;

/**
 * This class provides the notification for password reset emails.
 *
 * @package App\Notifications
 */
class PasswordChanged extends Notification
{
    use Queueable;

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
        return (new MailMessage)
            ->subject(Lang::get('mail.password_changed.subject', []))
            ->line(Lang::get('mail.password_changed.description'))
            ->line(Lang::get('mail.password_changed.signature', []))
            ->markdown('vendor.notifications.email', ['name' => $notifiable->fullname]);
    }
}
