<?php

namespace Tests\Backend\Unit;

use App\Models\Room;
use App\Models\RoomToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

class RoomTokenTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_create_room_token_unique_id()
    {
        $room = Room::factory()->create();
        RoomToken::factory()->count(1000)->create([
            'room_id' => $room,
        ]);
        $this->assertDatabaseCount('room_tokens', 1000);
    }

    public function test_create_room_token_update()
    {
        $token = RoomToken::factory()->create();
        $old_token = $token->token;
        $token->firstname = 'Test';
        $token->save();
        $this->assertEquals($old_token, $token->token);
    }
}
