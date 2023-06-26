<?php

namespace App\Services;

use App\Enums\CustomStatusCodes;
use App\Models\Meeting;
use App\Models\Room;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Log;

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
        Log::info('Starting room {room}', ['room' => $this->room->id, 'room-name' => $this->room->name ]);

        // Maximum waiting time (server response timeout + server connect timeout) before failing
        $timeout = config('bigbluebutton.server_timeout') + config('bigbluebutton.server_connect_timeout');

        // Atomic lock for room start to prevent users from simultaneously starting the same room
        $lock = Cache::lock('startroom-'.$this->room->id, $timeout);

        try {
            // Block the lock for a max. of 45sec
            $lock->block($timeout);

            $meeting = $this->room->runningMeeting();
            if (!$meeting) {
                Log::info('Room {room} not running, creating a new meeting', ['room' => $this->room->id ]);
                if ($this->room->roomTypeInvalid) {
                    $lock->release();
                    Log::warning('Failed to create meeting for room {room}; invalid room type', ['room' => $this->room->id ]);
                    abort(CustomStatusCodes::ROOM_TYPE_INVALID, __('app.errors.room_type_invalid'));
                }

                // Check if user didn't see the attendance recording note, but the attendance is recorded
                if (setting('attendance.enabled') && $this->room->record_attendance && !$agreedToAttendance) {
                    $lock->release();
                    Log::warning('Failed to create meeting for room {room}; attendance agreement missing', ['room' => $this->room->id ]);
                    abort(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING, __('app.errors.attendance_agreement_missing'));
                }

                Log::info('Finding server with lowest usage for room {room}', ['room' => $this->room->id ]);

                // Basic load balancing: get server with the lowest usage
                $loadBalancingService = new LoadBalancingService();
                $server               = $loadBalancingService
                    ->setServerPool($this->room->roomType->serverPool)
                    ->getLowestUsageServer();

                // If no server found, throw error
                if ($server == null) {
                    $lock->release();
                    Log::error('Failed to create meeting for room {room}; no servers found', ['room' => $this->room->id ]);
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

                Log::info('Starting new meeting for room {room} on server {server}', ['room' => $this->room->id, 'server' => $server->id ]);
                if (!$meetingService->start()) {
                    $lock->release();
                    Log::error('Failed to start meeting for room {room} on server {server}', ['room' => $this->room->id, 'server' => $server->id ]);
                    abort(CustomStatusCodes::ROOM_START_FAILED, __('app.errors.room_start'));
                }

                Log::info('Successfully started new meeting for room {room} on server {server}', ['room' => $this->room->id, 'server' => $server->id ]);

                // Set start time after successful api call, prevents user from tying to join this meeting before it is ready
                $meeting->start = date('Y-m-d H:i:s');
                $meeting->save();
                $lock->release();
            } else {
                Log::info('Room {room} already has running meeting', ['room' => $this->room->id ]);

                $meetingService = new MeetingService($meeting);
                // meeting in still starting
                if ($meeting->start == null) {
                    $lock->release();
                    Log::warning('Failed to join meeting for room {room}; meeting is still starting', ['room' => $this->room->id ]);
                    abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
                }
                // Check if the meeting is actually running on the server
                if (!$meetingService->isRunning()) {
                    $meetingService->setEnd();
                    $lock->release();
                    Log::warning('Failed to join meeting for room {room}; meeting is not running', ['room' => $this->room->id ]);
                    abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
                }

                // Check if user didn't see the attendance recording note, but the attendance is recorded
                if (setting('attendance.enabled') && $meeting->record_attendance && !$agreedToAttendance) {
                    $lock->release();
                    Log::warning('Failed to join meeting for room {room}; attendance agreement missing', ['room' => $this->room->id ]);
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
        Log::info('Joining room {room}', ['room' => $this->room->id, 'room-name' => $this->room->name ]);

        // Check if there is a meeting running for this room, accordingly to the local database
        $meeting = $this->room->runningMeeting();
        // no meeting found
        if ($meeting == null) {
            Log::warning('Failed to join meeting for room {room}; no running meeting found', ['room' => $this->room->id ]);
            abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
        }
        // meeting in still starting
        if ($meeting->start == null) {
            Log::warning('Failed to join meeting for room {room}; meeting is still starting', ['room' => $this->room->id ]);
            abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
        }

        $meetingService = new MeetingService($meeting);

        Log::info('Check if meeting for room {room} is running on the BBB server', ['room' => $this->room->id ]);

        // Check if the meeting is actually running on the server
        if (!$meetingService->isRunning() ) {
            $meetingService->setEnd();
            Log::warning('Meeting for room {room} is not running on the BBB server', ['room' => $this->room->id ]);
            abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
        }

        Log::info('Meeting for room {room} is running on the BBB server', ['room' => $this->room->id ]);

        // Check if user didn't see the attendance recording note, but the attendance is recorded
        if (setting('attendance.enabled') && $meeting->record_attendance && !$agreedToAttendance) {
            Log::warning('Failed to join meeting for room {room}; attendance agreement missing', ['room' => $this->room->id ]);
            abort(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING, __('app.errors.attendance_agreement_missing'));
        }

        return $meetingService;
    }
}
