<?php

namespace Tests\Unit;

use App\Room;
use App\RoomType;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class RoomTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function testCreateRoomWithoutName()
    {
        $this->expectException(QueryException::class);
        $newRoom = new Room();
        $newRoom->save();
    }

    public function testCreateRoom()
    {
        $room = Room::factory()->create();
        $this->assertDatabaseHas('rooms', ['id' => $room->id,'name' => $room->name]);
    }

    public function testCreateRoomUniqueID()
    {
        $roomType = RoomType::factory()->create();
        Room::factory()->count(1000)->create(['room_type_id'=>$roomType]);
        $this->assertDatabaseCount('rooms', 1000);
    }
}
