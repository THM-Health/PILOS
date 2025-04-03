<?php

namespace App\Events;

use App\Models\Room;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoomStarted
{
    use Dispatchable, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(private Room $room)
    {
        //
    }

    public function getRoom(): Room
    {
        return $this->room;
    }
}
