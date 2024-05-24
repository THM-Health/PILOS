<?php

namespace Tests\Unit\Console;

use App\Enums\TimePeriod;
use App\Models\RoomToken;
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
        $this->roomSettings->token_expiration = TimePeriod::UNLIMITED;
        $this->roomSettings->save();
        RoomToken::factory()->count(2)->create();
        $this->assertDatabaseCount('room_tokens', 2);
        $this->artisan('room:tokens:delete')
            ->assertExitCode(0);
        $this->assertDatabaseCount('room_tokens', 2);
    }

    public function testDeletionOfExpiredRoomTokens()
    {
        $this->roomSettings->token_expiration = TimePeriod::ONE_WEEK;
        $this->roomSettings->save();
        RoomToken::factory()->count(2)->create();

        RoomToken::factory()->create([
            'created_at' => Carbon::now()->subDays(8),
        ]);

        RoomToken::factory()->create([
            'created_at' => Carbon::now()->subDays(8),
            'last_usage' => Carbon::now()->subDays(6),
        ]);

        RoomToken::factory()->create([
            'created_at' => Carbon::now()->subDays(20),
            'last_usage' => Carbon::now()->subDays(8),
        ]);

        $this->assertDatabaseCount('room_tokens', 5);
        $this->artisan('room:tokens:delete')
            ->assertExitCode(0);
        $this->assertDatabaseCount('room_tokens', 3);
    }
}
