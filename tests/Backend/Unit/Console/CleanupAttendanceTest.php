<?php

namespace Tests\Backend\Unit\Console;

use App\Enums\TimePeriod;
use App\Models\Meeting;
use App\Models\MeetingAttendee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Backend\TestCase;

class CleanupAttendanceTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_clear()
    {
        $this->recordingSettings->attendance_retention_period = TimePeriod::TWO_WEEKS;
        $this->recordingSettings->save();
        // Create fake data
        $meeting = Meeting::factory()->create();

        $meetingAttendee1 = new MeetingAttendee;
        $meetingAttendee1->meeting()->associate($meeting);
        $meetingAttendee1->name = 'John Doe';
        $meetingAttendee1->session_id = 'PogeR6XH8I2SAeCqc8Cp5y5bD9Qq70dRxe4DzBcb';
        $meetingAttendee1->join = now();
        $meetingAttendee1->save();

        $meetingAttendee2 = new MeetingAttendee;
        $meetingAttendee2->meeting()->associate($meeting);
        $meetingAttendee2->name = 'John Doe';
        $meetingAttendee2->session_id = 'PogeR6XH8I2SAeCqc8Cp5y5bD9Qq70dRxe4DzBcb';
        $meetingAttendee2->join = now()->subDays(15)->toDateString();
        $meetingAttendee2->save();

        // Check if the datasets exit
        $this->assertCount(2, $meeting->attendees);

        // Run cleanup command
        $this->artisan('cleanup:attendance');

        // Reload database
        $meeting->refresh();

        // Check if old datasets have been removed and only the newer datasets are still there
        $this->assertCount(1, $meeting->attendees);
        $this->assertTrue($meeting->attendees()->first()->is($meetingAttendee1));
    }
}
