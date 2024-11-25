<?php

namespace Tests\Backend\Unit;

use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

class RoomTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_create_room_without_name()
    {
        $this->expectException(QueryException::class);
        $newRoom = new Room;
        $newRoom->save();
    }

    public function test_create_room()
    {
        $room = Room::factory()->create();
        $this->assertDatabaseHas('rooms', ['id' => $room->id, 'name' => $room->name]);
    }

    public function test_create_room_unique_id()
    {
        $roomType = RoomType::factory()->create();
        Room::factory()->count(1000)->create(['room_type_id' => $roomType]);
        $this->assertDatabaseCount('rooms', 1000);
    }
}
