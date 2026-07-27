<?php

declare(strict_types=1);

namespace Tests\Backend\Unit\Console;

use App\Enums\TimePeriod;
use App\Models\RoomPersonalizedLink;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

class DeleteObsoletePersonalizedLinksTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * @see TestCase::setUp()
     */
    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_no_room_personalized_link_expiration()
    {
        $this->roomSettings->personalized_link_expiration = TimePeriod::UNLIMITED;
        $this->roomSettings->save();
        RoomPersonalizedLink::factory()->count(2)->create();
        $this->assertDatabaseCount('room_personalized_links', 2);
        $this->artisan('room:personal-links:delete')
            ->assertExitCode(0);
        $this->assertDatabaseCount('room_personalized_links', 2);
    }

    public function test_deletion_of_expired_room_tokens()
    {
        $this->roomSettings->personalized_link_expiration = TimePeriod::ONE_WEEK;
        $this->roomSettings->save();
        RoomPersonalizedLink::factory()->count(2)->create();

        RoomPersonalizedLink::factory()->create([
            'created_at' => Carbon::now()->subDays(8),
        ]);

        RoomPersonalizedLink::factory()->create([
            'created_at' => Carbon::now()->subDays(8),
            'last_usage' => Carbon::now()->subDays(6),
        ]);

        RoomPersonalizedLink::factory()->create([
            'created_at' => Carbon::now()->subDays(20),
            'last_usage' => Carbon::now()->subDays(8),
        ]);

        $this->assertDatabaseCount('room_personalized_links', 5);
        $this->artisan('room:personal-links:delete')
            ->assertExitCode(0);
        $this->assertDatabaseCount('room_personalized_links', 3);
    }
}
