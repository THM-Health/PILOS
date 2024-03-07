<?php

namespace Tests\Unit\Console;

use App\Models\Meeting;
use App\Models\Room;
use App\Notifications\RoomExpires;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CleanupRoomsTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Check if rooms that have not been used for too long and rooms that have never been used are marked as to be deleted and emails are send to the owners
     *
     * @throws \Exception
     */
    public function testSetExpireDateAndSendEmail()
    {
        Notification::fake();

        // Set time periods
        setting()->set('room_auto_delete.enabled', true);
        setting()->set('room_auto_delete.inactive_period', 90);
        setting()->set('room_auto_delete.never_used_period', 30);
        setting()->set('room_auto_delete.deadline_period', 7);

        // Create room that has been inactive too long
        $roomInactiveTooLong = Room::factory()->create();
        $meetingInactiveTooLong = Meeting::factory()->create(['room_id' => $roomInactiveTooLong->id, 'start' => now()->subDays(91), 'end' => now()->subDays(91)->addMinutes(10)]);
        Meeting::factory()->create(['room_id' => $roomInactiveTooLong->id, 'start' => now()->subDays(95), 'end' => now()->subDays(95)->addMinutes(10)]);
        $roomInactiveTooLong->latestMeeting()->associate($meetingInactiveTooLong);
        $roomInactiveTooLong->save();

        // Create room that has not been inactive too long
        $roomInactiveNotTooLong = Room::factory()->create();
        $meetingInactiveNotTooLong = Meeting::factory()->create(['room_id' => $roomInactiveNotTooLong->id, 'start' => now()->subDays(89), 'end' => now()->subDays(89)->addMinutes(10)]);
        Meeting::factory()->create(['room_id' => $roomInactiveTooLong->id, 'start' => now()->subDays(95), 'end' => now()->subDays(95)->addMinutes(10)]);
        $roomInactiveNotTooLong->latestMeeting()->associate($meetingInactiveNotTooLong);
        $roomInactiveNotTooLong->save();

        // Create room has was created too long ago and never used
        $roomNeverUsedTooLong = Room::factory()->create(['created_at' => now()->subDays(31)]);

        // Create room has was created not too long ago but never used
        $roomNeverUsedNotTooLong = Room::factory()->create(['created_at' => now()->subDays(29)]);

        // Run cleanup command
        $this->artisan('cleanup:rooms');

        // Check if room is marked as to be deleted and email send
        $roomInactiveTooLong->refresh();
        $this->assertNotNull($roomInactiveTooLong->delete_inactive);

        $this->assertEquals(7, ceil(now()->floatDiffInHours($roomInactiveTooLong->delete_inactive)) / 24);
        Notification::assertSentTo($roomInactiveTooLong->owner, RoomExpires::class, function ($notification) use ($roomInactiveTooLong) {
            $mail = $notification->toMail($roomInactiveTooLong->owner)->toArray();
            $this->assertEquals($mail['actionUrl'], url('rooms/'.$roomInactiveTooLong->id));

            return true;
        });

        // Check if room is not marked as to be deleted and no email send
        $roomInactiveNotTooLong->refresh();
        $this->assertNull($roomInactiveNotTooLong->delete_inactive);
        Notification::assertNotSentTo($roomInactiveNotTooLong->owner, RoomExpires::class);

        // Check if room is marked as to be deleted and email send
        $roomNeverUsedTooLong->refresh();
        $this->assertNotNull($roomNeverUsedTooLong->delete_inactive);
        $this->assertEquals(7, ceil(now()->floatDiffInHours($roomNeverUsedTooLong->delete_inactive)) / 24);
        Notification::assertSentTo($roomNeverUsedTooLong->owner, RoomExpires::class, function ($notification) use ($roomNeverUsedTooLong) {
            $mail = $notification->toMail($roomNeverUsedTooLong->owner)->toArray();
            $this->assertEquals($mail['actionUrl'], url('rooms/'.$roomNeverUsedTooLong->id));

            return true;
        });

        // Check if room is not marked as to be deleted and no email send
        $roomNeverUsedNotTooLong->refresh();
        $this->assertNull($roomNeverUsedNotTooLong->delete_inactive);
        Notification::assertNotSentTo($roomNeverUsedNotTooLong->owner, RoomExpires::class);
    }

    /**
     * Check if rooms that have not been used for too long but not rooms that have never been used are marked as to be deleted and emails are send to the owners
     *
     * @throws \Exception
     */
    public function testSetExpireDateAndSendEmailOnlyInactive()
    {
        Notification::fake();

        // Set time periods
        setting()->set('room_auto_delete.enabled', true);
        setting()->set('room_auto_delete.inactive_period', 90);
        setting()->set('room_auto_delete.never_used_period', -1);
        setting()->set('room_auto_delete.deadline_period', 7);

        // Create room that has been inactive too long
        $roomInactiveTooLong = Room::factory()->create();
        $meetingInactiveTooLong = Meeting::factory()->create(['room_id' => $roomInactiveTooLong->id, 'start' => now()->subDays(91), 'end' => now()->subDays(91)->addMinutes(10)]);
        Meeting::factory()->create(['room_id' => $roomInactiveTooLong->id, 'start' => now()->subDays(95), 'end' => now()->subDays(95)->addMinutes(10)]);
        $roomInactiveTooLong->latestMeeting()->associate($meetingInactiveTooLong);
        $roomInactiveTooLong->save();

        // Create room that has not been inactive too long
        $roomInactiveNotTooLong = Room::factory()->create();
        $meetingInactiveNotTooLong = Meeting::factory()->create(['room_id' => $roomInactiveNotTooLong->id, 'start' => now()->subDays(89), 'end' => now()->subDays(89)->addMinutes(10)]);
        Meeting::factory()->create(['room_id' => $roomInactiveTooLong->id, 'start' => now()->subDays(95), 'end' => now()->subDays(95)->addMinutes(10)]);
        $roomInactiveNotTooLong->latestMeeting()->associate($meetingInactiveNotTooLong);
        $roomInactiveNotTooLong->save();

        // Create room has was created too long ago and never used
        $roomNeverUsedTooLong = Room::factory()->create(['created_at' => now()->subDays(31)]);

        // Create room has was created not too long ago but never used
        $roomNeverUsedNotTooLong = Room::factory()->create(['created_at' => now()->subDays(29)]);

        // Run cleanup command
        $this->artisan('cleanup:rooms');

        // Check if room is marked as to be deleted and email send
        $roomInactiveTooLong->refresh();
        $this->assertNotNull($roomInactiveTooLong->delete_inactive);

        $this->assertEquals(7, ceil(now()->floatDiffInHours($roomInactiveTooLong->delete_inactive)) / 24);
        Notification::assertSentTo($roomInactiveTooLong->owner, RoomExpires::class, function ($notification) use ($roomInactiveTooLong) {
            $mail = $notification->toMail($roomInactiveTooLong->owner)->toArray();
            $this->assertEquals($mail['actionUrl'], url('rooms/'.$roomInactiveTooLong->id));

            return true;
        });

        // Check if room is not marked as to be deleted and no email send
        $roomInactiveNotTooLong->refresh();
        $this->assertNull($roomInactiveNotTooLong->delete_inactive);
        Notification::assertNotSentTo($roomInactiveNotTooLong->owner, RoomExpires::class);

        // Check if room is not marked as to be deleted and email send
        $roomNeverUsedTooLong->refresh();
        $this->assertNull($roomNeverUsedTooLong->delete_inactive);
        Notification::assertNotSentTo($roomNeverUsedTooLong->owner, RoomExpires::class);

        // Check if room is not marked as to be deleted and no email send
        $roomNeverUsedNotTooLong->refresh();
        $this->assertNull($roomNeverUsedNotTooLong->delete_inactive);
        Notification::assertNotSentTo($roomNeverUsedNotTooLong->owner, RoomExpires::class);
    }

    /**
     * Check if rooms that have never been used but not rooms that have not been used for too long are marked as to be deleted and emails are send to the owners
     *
     * @throws \Exception
     */
    public function testSetExpireDateAndSendEmailOnlyNeverUsed()
    {
        Notification::fake();

        // Set time periods
        setting()->set('room_auto_delete.enabled', true);
        setting()->set('room_auto_delete.inactive_period', -1);
        setting()->set('room_auto_delete.never_used_period', 30);
        setting()->set('room_auto_delete.deadline_period', 7);

        // Create room that has been inactive too long
        $roomInactiveTooLong = Room::factory()->create();
        $meetingInactiveTooLong = Meeting::factory()->create(['room_id' => $roomInactiveTooLong->id, 'start' => now()->subDays(91), 'end' => now()->subDays(91)->addMinutes(10)]);
        Meeting::factory()->create(['room_id' => $roomInactiveTooLong->id, 'start' => now()->subDays(95), 'end' => now()->subDays(95)->addMinutes(10)]);
        $roomInactiveTooLong->latestMeeting()->associate($meetingInactiveTooLong);
        $roomInactiveTooLong->save();

        // Create room that has not been inactive too long
        $roomInactiveNotTooLong = Room::factory()->create();
        $meetingInactiveNotTooLong = Meeting::factory()->create(['room_id' => $roomInactiveNotTooLong->id, 'start' => now()->subDays(89), 'end' => now()->subDays(89)->addMinutes(10)]);
        Meeting::factory()->create(['room_id' => $roomInactiveTooLong->id, 'start' => now()->subDays(95), 'end' => now()->subDays(95)->addMinutes(10)]);
        $roomInactiveNotTooLong->latestMeeting()->associate($meetingInactiveNotTooLong);
        $roomInactiveNotTooLong->save();

        // Create room has was created too long ago and never used
        $roomNeverUsedTooLong = Room::factory()->create(['created_at' => now()->subDays(31)]);

        // Create room has was created not too long ago but never used
        $roomNeverUsedNotTooLong = Room::factory()->create(['created_at' => now()->subDays(29)]);

        // Run cleanup command
        $this->artisan('cleanup:rooms');

        // Check if room is not marked as to be deleted and email send
        $roomInactiveTooLong->refresh();
        $this->assertNull($roomInactiveTooLong->delete_inactive);
        Notification::assertNotSentTo($roomInactiveTooLong->owner, RoomExpires::class);

        // Check if room is not marked as to be deleted and no email send
        $roomInactiveNotTooLong->refresh();
        $this->assertNull($roomInactiveNotTooLong->delete_inactive);
        Notification::assertNotSentTo($roomInactiveNotTooLong->owner, RoomExpires::class);

        // Check if room is marked as to be deleted and email send
        $roomNeverUsedTooLong->refresh();
        $this->assertNotNull($roomNeverUsedTooLong->delete_inactive);
        $this->assertEquals(7, ceil(now()->floatDiffInHours($roomNeverUsedTooLong->delete_inactive)) / 24);
        Notification::assertSentTo($roomNeverUsedTooLong->owner, RoomExpires::class, function ($notification) use ($roomNeverUsedTooLong) {
            $mail = $notification->toMail($roomNeverUsedTooLong->owner)->toArray();
            $this->assertEquals($mail['actionUrl'], url('rooms/'.$roomNeverUsedTooLong->id));

            return true;
        });

        // Check if room is not marked as to be deleted and no email send
        $roomNeverUsedNotTooLong->refresh();
        $this->assertNull($roomNeverUsedNotTooLong->delete_inactive);
        Notification::assertNotSentTo($roomNeverUsedNotTooLong->owner, RoomExpires::class);
    }

    /**
     * Check if command not run if auto delete is disabled or both periods are disabled
     *
     * @throws \Exception
     */
    public function testSetExpireDateAndSendEmailDisabled()
    {
        // Set time periods
        setting()->set('room_auto_delete.enabled', true);
        setting()->set('room_auto_delete.inactive_period', 90);
        setting()->set('room_auto_delete.never_used_period', 30);
        setting()->set('room_auto_delete.deadline_period', 7);

        // Create room that has been inactive too long
        $roomInactiveTooLong = Room::factory()->create();
        $meetingInactiveTooLong = Meeting::factory()->create(['room_id' => $roomInactiveTooLong->id, 'start' => now()->subDays(91), 'end' => now()->subDays(91)->addMinutes(10)]);
        Meeting::factory()->create(['room_id' => $roomInactiveTooLong->id, 'start' => now()->subDays(95), 'end' => now()->subDays(95)->addMinutes(10)]);
        $roomInactiveTooLong->latestMeeting()->associate($meetingInactiveTooLong);
        $roomInactiveTooLong->save();

        // Create room that has not been inactive too long
        $roomInactiveNotTooLong = Room::factory()->create();
        $meetingInactiveNotTooLong = Meeting::factory()->create(['room_id' => $roomInactiveNotTooLong->id, 'start' => now()->subDays(89), 'end' => now()->subDays(89)->addMinutes(10)]);
        Meeting::factory()->create(['room_id' => $roomInactiveTooLong->id, 'start' => now()->subDays(95), 'end' => now()->subDays(95)->addMinutes(10)]);
        $roomInactiveNotTooLong->latestMeeting()->associate($meetingInactiveNotTooLong);
        $roomInactiveNotTooLong->save();

        // Create room has was created too long ago and never used
        $roomNeverUsedTooLong = Room::factory()->create(['created_at' => now()->subDays(31)]);

        // Create room has was created not too long ago but never used
        $roomNeverUsedNotTooLong = Room::factory()->create(['created_at' => now()->subDays(29)]);

        // Disable
        setting()->set('room_auto_delete.enabled', false);

        // Run cleanup command
        $this->artisan('cleanup:rooms');

        $roomInactiveTooLong->refresh();
        $this->assertNull($roomInactiveTooLong->delete_inactive);

        $roomInactiveNotTooLong->refresh();
        $this->assertNull($roomInactiveNotTooLong->delete_inactive);

        $roomNeverUsedTooLong->refresh();
        $this->assertNull($roomNeverUsedTooLong->delete_inactive);

        $roomNeverUsedNotTooLong->refresh();
        $this->assertNull($roomNeverUsedNotTooLong->delete_inactive);

        // Enable
        setting()->set('room_auto_delete.enabled', true);

        // Set both periods to disabled
        setting()->set('room_auto_delete.inactive_period', -1);
        setting()->set('room_auto_delete.never_used_period', -1);

        // Run cleanup command again
        $this->artisan('cleanup:rooms');

        $roomInactiveTooLong->refresh();
        $this->assertNull($roomInactiveTooLong->delete_inactive);

        $roomInactiveNotTooLong->refresh();
        $this->assertNull($roomInactiveNotTooLong->delete_inactive);

        $roomNeverUsedTooLong->refresh();
        $this->assertNull($roomNeverUsedTooLong->delete_inactive);

        $roomNeverUsedNotTooLong->refresh();
        $this->assertNull($roomNeverUsedNotTooLong->delete_inactive);
    }

    /**
     * Check if rooms are deleted after their grace period
     */
    public function testDelete()
    {
        Notification::fake();

        setting()->set('room_auto_delete.enabled', true);

        $roomNotToDelete = Room::factory()->create();
        $roomToDelete = Room::factory()->create(['delete_inactive' => now()->subDay()]);
        $roomToNotDeleteYet = Room::factory()->create(['delete_inactive' => now()->addDay()]);

        // Run cleanup command
        $this->artisan('cleanup:rooms');

        $this->assertModelExists($roomNotToDelete);
        $this->assertModelMissing($roomToDelete);
        $this->assertModelExists($roomToNotDeleteYet);
    }
}
