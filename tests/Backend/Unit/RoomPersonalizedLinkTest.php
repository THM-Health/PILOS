<?php

declare(strict_types=1);

namespace Tests\Backend\Unit;

use App\Models\Room;
use App\Models\RoomPersonalizedLink;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

class RoomPersonalizedLinkTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_create_room_personalized_link_unique_token()
    {
        $room = Room::factory()->create();
        RoomPersonalizedLink::factory()->count(1000)->create([
            'room_id' => $room,
        ]);
        $this->assertDatabaseCount('room_personalized_links', 1000);
    }

    public function test_create_room_personalized_link_update()
    {
        $link = RoomPersonalizedLink::factory()->create();
        $old_token = $link->token;
        $link->firstname = 'Test';
        $link->save();
        $this->assertEquals($old_token, $link->token);
    }
}
