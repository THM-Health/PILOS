<?php

namespace Tests\Unit\Console;

use App\RoomToken;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class DeleteObsoleteTokensTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * @see TestCase::setUp()
     */
    protected function setUp(): void
    {
        parent::setUp();
    }

    public function testNoRoomTokenExpiration()
    {
        setting(['room_token_expiration' => -1]);
        factory(RoomToken::class, 2)->create();
        $this->assertDatabaseCount('room_tokens', 2);
        $this->artisan('room:tokens:delete')
            ->assertExitCode(0);
        $this->assertDatabaseCount('room_tokens', 2);
    }

    public function testDeletionOfExpiredRoomTokens()
    {
        setting(['room_token_expiration' => 10]);
        factory(RoomToken::class, 2)->create();

        factory(RoomToken::class)->create([
            'created_at' => Carbon::now()->subMinutes(11)
        ]);
        $this->assertDatabaseCount('room_tokens', 3);
        $this->artisan('room:tokens:delete')
            ->assertExitCode(0);
        $this->assertDatabaseCount('room_tokens', 2);
    }
}
