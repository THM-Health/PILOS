<?php

namespace Tests\Unit;

use App\Room;
use App\RoomType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class RoomTypeTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    // Check if there is always a default room type
    public function testRoomTypeDefault()
    {
        // Remove all room types
        RoomType::truncate();

        // Create first non default room, that should be forced to be default
        $room1 = factory(RoomType::class)->create(['default'=>false]);
        self::assertTrue($room1->default);

        // Add second non default room
        $room2 = factory(RoomType::class)->create(['default'=>false]);
        $room1->refresh();
        self::assertTrue($room1->default);
        self::assertFalse($room2->default);

        // Add new default room
        $room3 = factory(RoomType::class)->create(['default'=>true]);
        $room1->refresh();
        $room2->refresh();
        self::assertFalse($room1->default);
        self::assertFalse($room2->default);
        self::assertTrue($room3->default);

        // Try to unset default
        $room3->default = false;
        $room3->save();
        $room3->refresh();
        self::assertFalse($room1->default);
        self::assertFalse($room2->default);
        self::assertTrue($room3->default);

        // Try to set default
        $room2->default = true;
        $room2->save();
        $room1->refresh();
        $room2->refresh();
        $room3->refresh();
        self::assertFalse($room1->default);
        self::assertTrue($room2->default);
        self::assertFalse($room3->default);

        // Remove current default
        self::assertTrue($room2->delete());
        $room1->refresh();
        $room3->refresh();
        self::assertTrue($room1->default);
        self::assertFalse($room3->default);

        // Try to remove other room types
        self::assertTrue($room1->delete());
        self::assertTrue($room3->delete());
    }
}
