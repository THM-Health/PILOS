<?php

namespace App\Services;

use App\Enums\CustomStatusCodes;
use App\Models\Meeting;
use App\Models\Room;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;

class RoomService
{
    protected Room $room;

    /**
     * @param Room $room
     */
    public function __construct(Room $room)
    {
        $this->room = $room;
    }

    /**
     * Start a new meeting
     * @param  bool           $agreedToAttendance
     * @return MeetingService
     * @throws \Exception
     */
    public function start(bool $agreedToAttendance = false)
    {
        // Atomic lock for room start to prevent users from simultaneously starting the same room
        // Maximum waiting time 45sec before failing
        $lock = Cache::lock('startroom-'.$this->room->id, config('bigbluebutton.server_timeout'));

        try {
            // Block the lock for a max. of 45sec
            $lock->block(config('bigbluebutton.server_timeout'));

            $meeting = $this->room->runningMeeting();
            if (!$meeting) {
                if ($this->room->roomTypeInvalid) {
                    $lock->release();
                    abort(CustomStatusCodes::ROOM_TYPE_INVALID, __('app.errors.room_type_invalid'));
                }

                // Check if user didn't see the attendance recording note, but the attendance is recorded
                if (setting('attendance.enabled') && $this->room->record_attendance && !$agreedToAttendance) {
                    $lock->release();
                    abort(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING, __('app.errors.attendance_agreement_missing'));
                }

                // Basic load balancing, get server with lowest usage
                $loadBalancingService = new LoadBalancingService();
                $server               = $loadBalancingService
                    ->setServerPool($this->room->roomType->serverPool)
                    ->getLowestUsage();

                // If no server found, throw error
                if ($server == null) {
                    $lock->release();
                    abort(CustomStatusCodes::NO_SERVER_AVAILABLE, __('app.errors.no_server_available'));
                }

                // Create new meeting
                $meeting                     = new Meeting();
                $meeting->attendee_pw        = bin2hex(random_bytes(5));
                $meeting->moderator_pw       = bin2hex(random_bytes(5));
                $meeting->record_attendance  = setting('attendance.enabled') && $this->room->record_attendance;
                $meeting->server()->associate($server);
                $meeting->room()->associate($this->room);
                $meeting->save();

                $meetingService = new MeetingService($meeting);

                if (!$meetingService->start()) {
                    $lock->release();
                    abort(CustomStatusCodes::ROOM_START_FAILED, __('app.errors.room_start'));
                }

                // Set start time after successful api call, prevents user from tying to join this meeting before it is ready
                $meeting->start = date('Y-m-d H:i:s');
                $meeting->save();
                $lock->release();
            } else {
                $meetingService = new MeetingService($meeting);
                // meeting in still starting
                if ($meeting->start == null) {
                    $lock->release();
                    abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
                }
                // Check if the meeting is actually running on the server
                if (!$meetingService->isRunning()) {
                    $meetingService->setEnd();
                    $lock->release();
                    abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
                }

                // Check if user didn't see the attendance recording note, but the attendance is recorded
                if (setting('attendance.enabled') && $meeting->record_attendance && !$agreedToAttendance) {
                    $lock->release();
                    abort(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING, __('app.errors.attendance_agreement_missing'));
                }
                $lock->release();
            }
        } catch (LockTimeoutException $e) {
            abort(CustomStatusCodes::ROOM_START_FAILED, __('app.errors.room_start'));
        }

        $this->room->delete_inactive = null;
        $this->room->save();

        return $meetingService;
    }

    /**
     * Join a running meeting
     * @param  bool           $agreedToAttendance
     * @return MeetingService
     */
    public function join(bool $agreedToAttendance = false)
    {
        // Check if there is a meeting running for this room, accordingly to the local database
        $meeting = $this->room->runningMeeting();
        // no meeting found
        if ($meeting == null) {
            abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
        }
        // meeting in still starting
        if ($meeting->start == null) {
            abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
        }

        $meetingService = new MeetingService($meeting);

        // Check if the meeting is actually running on the server
        if (!$meetingService->isRunning() ) {
            $meetingService->setEnd();
            abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
        }

        // Check if user didn't see the attendance recording note, but the attendance is recorded
        if (setting('attendance.enabled') && $meeting->record_attendance && !$agreedToAttendance) {
            abort(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING, __('app.errors.attendance_agreement_missing'));
        }

        return $meetingService;
    }
}
