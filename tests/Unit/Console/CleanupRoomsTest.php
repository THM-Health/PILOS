<?php

namespace Tests\Unit\Console;

use App\Meeting;
use App\Notifications\RoomExpires;
use App\Room;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CleanupRoomsTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Chek if rooms that have not been used for too long and rooms that have never been used are marked as to be deleted and emails are send to the owners
     * @throws \Exception
     */
    public function testSetExpireDateAndSendEmail()
    {
        Notification::fake();

        // Set time periods
        setting()->set('room_auto_delete.inactive_period', 90);
        setting()->set('room_auto_delete.never_used_period', 30);
        setting()->set('room_auto_delete.grace_period', 7);

        // Create room that has been inactive too long
        $roomInactiveTooLong = Room::factory()->create();
        Meeting::factory()->create(['room_id'=>$roomInactiveTooLong->id, 'start' => now()->subDays(91),'end' => now()->subDays(91)->addMinutes(10)]);
        Meeting::factory()->create(['room_id'=>$roomInactiveTooLong->id, 'start' => now()->subDays(95),'end' => now()->subDays(95)->addMinutes(10)]);

        // Create room that has not been inactive too long
        $roomInactiveNotTooLong = Room::factory()->create();
        Meeting::factory()->create(['room_id'=>$roomInactiveNotTooLong->id, 'start' => now()->subDays(89),'end' => now()->subDays(89)->addMinutes(10)]);
        Meeting::factory()->create(['room_id'=>$roomInactiveTooLong->id, 'start' => now()->subDays(95),'end' => now()->subDays(95)->addMinutes(10)]);

        // Create room has was created too long ago and never used
        $roomNeverUsedTooLong = Room::factory()->create(['created_at'=> now()->subDays(31)]);

        // Create room has was created not too long ago but never used
        $roomNeverUsedNotTooLong = Room::factory()->create(['created_at'=> now()->subDays(29)]);

        // Run cleanup command
        $this->artisan('cleanup:rooms');

        // Check if room is marked as to be deleted and email send
        $roomInactiveTooLong->refresh();
        $this->assertNotNull($roomInactiveTooLong->delete_inactive);
        $this->assertEquals(7, ceil(now()->floatDiffInDays($roomInactiveTooLong->delete_inactive)));
        Notification::assertSentTo($roomInactiveTooLong->owner, RoomExpires::class);

        // Check if room is not marked as to be deleted and no email send
        $roomInactiveNotTooLong->refresh();
        $this->assertNull($roomInactiveNotTooLong->delete_inactive);
        Notification::assertNotSentTo($roomInactiveNotTooLong->owner, RoomExpires::class);

        // Check if room is marked as to be deleted and email send
        $roomNeverUsedTooLong->refresh();
        $this->assertNotNull($roomNeverUsedTooLong->delete_inactive);
        $this->assertEquals(7, ceil(now()->floatDiffInDays($roomNeverUsedTooLong->delete_inactive)));
        Notification::assertSentTo($roomNeverUsedTooLong->owner, RoomExpires::class);

        // Check if room is not marked as to be deleted and no email send
        $roomNeverUsedNotTooLong->refresh();
        $this->assertNull($roomNeverUsedNotTooLong->delete_inactive);
        Notification::assertNotSentTo($roomNeverUsedNotTooLong->owner, RoomExpires::class);
    }

    /**
     * Check if rooms are deleted after their grace period
     */
    public function testDelete()
    {
        Notification::fake();

        $roomNotToDelete    = Room::factory()->create();
        $roomToDelete       = Room::factory()->create(['delete_inactive'=> now()->subDay()]);
        $roomToNotDeleteYet = Room::factory()->create(['delete_inactive'=> now()->addDay()]);

        // Run cleanup command
        $this->artisan('cleanup:rooms');

        $this->assertModelExists($roomNotToDelete);
        $this->assertModelMissing($roomToDelete);
        $this->assertModelExists($roomToNotDeleteYet);
    }
}
