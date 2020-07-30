<?php

namespace Tests\Unit;

use App\Room;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoomTest extends TestCase
{
    use RefreshDatabase;

    public function testCreateRoomWithoutName()
    {
        $this->expectException(QueryException::class);
        $newRoom = new Room();
        $newRoom->save();
    }

    public function testCreateRoom()
    {
        $room = factory(Room::class)->create();
        $this->assertDatabaseHas('rooms', ['id' => $room->id,'name' => $room->name]);
    }

    public function testCreateRoomUniqueID()
    {
        factory(Room::class, 1000)->create();
        $this->assertDatabaseCount('rooms', 1000);
    }
}
