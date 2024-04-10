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

    public function __construct(Room $room)
    {
        $this->room = $room;
    }

    /**
     * Start a new meeting
     *
     * @return MeetingService
     *
     * @throws \Exception
     */
    public function start(bool $agreedToAttendance = false, bool $agreedToRecord = false)
    {
        Log::info('Starting room {room}', ['room' => $this->room->id, 'room-name' => $this->room->name]);

        // Maximum waiting time (server response timeout + server connect timeout) before failing
        $timeout = config('bigbluebutton.server_timeout') + config('bigbluebutton.server_connect_timeout');

        // Atomic lock for room start to prevent users from simultaneously starting the same room
        $lock = Cache::lock('startroom-'.$this->room->id, $timeout);

        try {
            // Block the lock for a max. of 45sec
            $lock->block($timeout);

            $meeting = $this->room->latestMeeting;
            // If no meeting found, or meeting is already ended or detached, create a new one
            if (! $meeting || $meeting->end != null || $meeting->detached != null) {
                Log::info('Room {room} not running, creating a new meeting', ['room' => $this->room->getLogLabel()]);
                if ($this->room->roomTypeInvalid) {
                    $lock->release();
                    Log::warning('Failed to create meeting for room {room}; invalid room type', ['room' => $this->room->getLogLabel()]);
                    abort(CustomStatusCodes::ROOM_TYPE_INVALID->value, __('app.errors.room_type_invalid'));
                }

                // Check if user didn't see the attendance recording note, but the attendance is recorded
                if ($this->room->roomType->allow_record_attendance && $this->room->record_attendance && ! $agreedToAttendance) {
                    $lock->release();
                    Log::warning('Failed to create meeting for room {room}; attendance agreement missing', ['room' => $this->room->getLogLabel()]);
                    abort(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING->value, __('app.errors.attendance_agreement_missing'));
                }

                // Check if user didn't see the recording note, but the meeting is recorded
                if ($this->room->record && ! $agreedToRecord) {
                    $lock->release();
                    Log::warning('Failed to create meeting for room {room}; record agreement missing', ['room' => $this->room->getLogLabel()]);
                    abort(CustomStatusCodes::RECORD_AGREEMENT_MISSING->value, __('app.errors.record_agreement_missing'));
                }

                Log::info('Finding server with lowest usage for room {room}', ['room' => $this->room->getLogLabel()]);

                // Basic load balancing: get server with the lowest usage
                $loadBalancingService = new LoadBalancingService();
                $server = $loadBalancingService
                    ->setServerPool($this->room->roomType->serverPool)
                    ->getLowestUsageServer();

                // If no server found, throw error
                if ($server == null) {
                    $lock->release();
                    Log::error('Failed to create meeting for room {room}; no servers found', ['room' => $this->room->getLogLabel()]);
                    abort(CustomStatusCodes::NO_SERVER_AVAILABLE->value, __('app.errors.no_server_available'));
                }

                // Create new meeting
                $meeting = new Meeting();
                $meeting->record_attendance = $this->room->roomType->allow_record_attendance && $this->room->record_attendance;
                $meeting->record = $this->room->roomType->allow_record && $this->room->record;
                $meeting->server()->associate($server);
                $meeting->room()->associate($this->room);
                $meeting->save();

                $meetingService = new MeetingService($meeting);

                Log::info('Starting new meeting for room {room} on server {server}', ['room' => $this->room->getLogLabel(), 'server' => $server->getLogLabel()]);
                if (! $meetingService->start()) {
                    $lock->release();
                    Log::error('Failed to start meeting for room {room} on server {server}', ['room' => $this->room->getLogLabel(), 'server' => $server->getLogLabel()]);
                    abort(CustomStatusCodes::ROOM_START_FAILED->value, __('app.errors.room_start'));
                }

                Log::info('Successfully started new meeting for room {room} on server {server}', ['room' => $this->room->getLogLabel(), 'server' => $server->getLogLabel()]);

                // Set start time after successful api call, prevents user from tying to join this meeting before it is ready
                $meeting->start = date('Y-m-d H:i:s');
                $meeting->save();

                $this->room->latestMeeting()->associate($meeting);
                $this->room->participant_count = 0;
                $this->room->listener_count = 0;
                $this->room->voice_participant_count = 0;
                $this->room->video_count = 0;
                $this->room->save();

                $lock->release();
            } else {
                Log::info('Room {room} already has running meeting', ['room' => $this->room->getLogLabel()]);

                $meetingService = new MeetingService($meeting);

                try {
                    $meetingRunning = $meetingService->isRunning();
                } catch (\Exception $e) {
                    $lock->release();
                    Log::warning('Error checking if room {room} is running on the BBB server', ['room' => $this->room->getLogLabel()]);
                    abort(CustomStatusCodes::JOIN_FAILED->value, __('app.errors.join_failed'));
                }

                // Check if the meeting is actually running on the server
                if (! $meetingRunning) {
                    $meetingService->setEnd();
                    $lock->release();
                    Log::warning('Failed to join meeting for room {room}; meeting is not running', ['room' => $this->room->getLogLabel()]);
                    abort(CustomStatusCodes::MEETING_NOT_RUNNING->value, __('app.errors.not_running'));
                }

                // Check if user didn't see the attendance recording note, but the attendance is recorded
                if ($meeting->record_attendance && ! $agreedToAttendance) {
                    $lock->release();
                    Log::warning('Failed to join meeting for room {room}; attendance agreement missing', ['room' => $this->room->getLogLabel()]);
                    abort(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING->value, __('app.errors.attendance_agreement_missing'));
                }
                $lock->release();
            }
        } catch (LockTimeoutException $e) {
            abort(CustomStatusCodes::ROOM_START_FAILED->value, __('app.errors.room_start'));
        }

        $this->room->delete_inactive = null;
        $this->room->save();

        return $meetingService;
    }

    /**
     * Join a running meeting
     *
     * @return MeetingService
     */
    public function join(bool $agreedToAttendance = false, bool $agreedToRecord = false)
    {
        Log::info('Joining room {room}', ['room' => $this->room->getLogLabel()]);

        // Check if there is a meeting running for this room, accordingly to the local database
        $meeting = $this->room->latestMeeting;

        // No running meeting found
        if ($meeting == null || $meeting->end != null) {
            Log::warning('Failed to join meeting for room {room}; no running meeting found', ['room' => $this->room->getLogLabel()]);
            abort(CustomStatusCodes::MEETING_NOT_RUNNING->value, __('app.errors.not_running'));
        }

        $meetingService = new MeetingService($meeting);

        Log::info('Check if meeting for room {room} is running on the BBB server', ['room' => $this->room->getLogLabel()]);

        try {
            // Check if meeting is running, if connection to server fails, do not modify the server health
            $meetingRunning = $meetingService->isRunning(true);
        } catch (\Exception $e) {
            Log::warning('Error checking if room {room} is running on the BBB server', ['room' => $this->room->getLogLabel()]);
            abort(CustomStatusCodes::JOIN_FAILED->value, __('app.errors.join_failed'));
        }

        // Check if the meeting is actually running on the server
        if (! $meetingRunning) {
            $meetingService->setEnd();
            Log::warning('Meeting for room {room} is not running on the BBB server', ['room' => $this->room->getLogLabel()]);
            abort(CustomStatusCodes::MEETING_NOT_RUNNING->value, __('app.errors.not_running'));
        }

        Log::info('Meeting for room {room} is running on the BBB server', ['room' => $this->room->getLogLabel()]);

        // Check if user didn't see the attendance recording note, but the attendance is recorded
        if ($meeting->record_attendance && ! $agreedToAttendance) {
            Log::warning('Failed to join meeting for room {room}; attendance agreement missing', ['room' => $this->room->getLogLabel()]);
            abort(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING->value, __('app.errors.attendance_agreement_missing'));
        }

        // Check if user didn't see the recording note, but the meeting is recorded
        if ($meeting->record && ! $agreedToRecord) {
            Log::warning('Failed to join meeting for room {room}; record agreement missing', ['room' => $this->room->getLogLabel()]);
            abort(CustomStatusCodes::RECORD_AGREEMENT_MISSING->value, __('app.errors.attendance_agreement_missing'));
        }

        return $meetingService;
    }
}
