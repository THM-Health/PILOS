<?php

namespace App\Notifications;

use App\Models\Room;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;

class RoomExpires extends Notification
{
    use Queueable;

    /**
     * The room.
     *
     * @var Room
     */
    private $room;

    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct(Room $room)
    {
        $this->room      = $room;
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
        // Date the room will be deleted
        $date = $this->room->delete_inactive
            ->timezone($notifiable->timezone)
            ->isoFormat('LLLL');

        // Date the room was created
        $createdAt = $this->room->created_at
            ->timezone($notifiable->timezone)
            ->isoFormat('LLLL');

        // Url to open the room
        $url = url('rooms/'.$this->room->id);

        // Get the latest meeting of the room
        $lastMeeting = $this->room->latestMeeting();

        $message = (new MailMessage)
            ->subject(Lang::get('mail.room_expires.subject', ['name' => $this->room->name]))
            ->line(Lang::get('mail.room_expires.intro', []));

        // If room has no meeting, room will deleted due to creating but never using the room
        if ($lastMeeting == null) {
            $message->line(Lang::get('mail.room_expires.no_meeting', ['name' => $this->room->name,'date' => $createdAt]));
        }
        // If room has a meeting, that was too long ago
        else {
            $days = now()->diffInDays($lastMeeting->start);
            $message->line(Lang::get('mail.room_expires.inactivity', ['name' => $this->room->name,'date' => $createdAt, 'days' => $days]));
        }

        return $message
            ->action(Lang::get('mail.room_expires.open', []), $url)
            ->line(Lang::get('mail.room_expires.expire', ['date' => $date]))
            ->line(Lang::get('mail.room_expires.keep', []))
            ->line(Lang::get('mail.room_expires.delete', []))
            ->markdown('vendor.notifications.email', ['name' => $notifiable->fullname]);
    }
}
