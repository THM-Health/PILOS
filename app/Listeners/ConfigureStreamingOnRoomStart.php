<?php

namespace App\Listeners;

use App\Events\RoomStarted;

class ConfigureStreamingOnRoomStart
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
    public function handle(RoomStarted $event): void
    {
        // Set the streaming enabled flag for the current meeting
        // to the value of the room's streaming enabled flag at the time of the meeting start

        $room = $event->getRoom();

        $room->streaming->enabled_for_current_meeting = $room->streaming->enabled;
        $room->streaming->status = null;
        $room->streaming->fps = null;
        $room->streaming->save();
    }
}
