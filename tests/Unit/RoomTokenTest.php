<?php

namespace Tests\Unit;

use App\Models\Room;
use App\Models\RoomToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class RoomTokenTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function testCreateRoomTokenUniqueID()
    {
        $room = Room::factory()->create();
        RoomToken::factory()->count(1000)->create([
            'room_id' => $room,
        ]);
        $this->assertDatabaseCount('room_tokens', 1000);
    }

    public function testCreateRoomTokenUpdate()
    {
        $token = RoomToken::factory()->create();
        $old_token = $token->token;
        $token->firstname = 'Test';
        $token->save();
        $this->assertEquals($old_token, $token->token);
    }
}
