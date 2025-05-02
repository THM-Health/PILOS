<?php

namespace Tests\Backend\Unit\Listeners;

use App\Events\RoomEnded;
use App\Models\Room;
use Tests\Backend\TestCase;

class ResetStreamingOnRoomStop extends TestCase
{
    public function test_room_streaming_data_reset()
    {
        $room = Room::factory()->create();
        $room->streaming->status = 'running';
        $room->streaming->fps = 30;
        $room->streaming->save();

        // Emit event
        RoomEnded::dispatch($room);

        // Check if status and fps are reset
        $room->streaming->refresh();
        $this->assertNull($room->streaming->status);
        $this->assertNull($room->streaming->fps);

    }
}
