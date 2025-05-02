<?php

namespace App\Listeners;

use App\Events\RoomEnded;

class ResetStreamingOnRoomStop
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(RoomEnded $event): void
    {
        // Reset streaming stats when the room is stopped

        $room = $event->getRoom();

        $room->streaming->status = null;
        $room->streaming->fps = null;
        $room->streaming->save();
    }
}
