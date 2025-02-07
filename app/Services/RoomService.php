<?php

namespace App\Services;

use App\Enums\CustomStatusCodes;
use App\Events\RoomStarted;
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
     */
    public function start(): MeetingService
    {
        Log::info('Starting room {room}', ['room' => $this->room->id, 'room-name' => $this->room->name]);

        // Maximum waiting time (server response timeout + server connect timeout) before failing
        $timeout = config('bigbluebutton.server_timeout') + config('bigbluebutton.server_connect_timeout');

        // Atomic lock for room start to prevent users from simultaneously starting the same room
        $lock = Cache::lock('startroom-'.$this->room->id, $timeout);

        try {
            // Block the lock for a max. of 45sec
            $lock->block($timeout);

            // Get latest of the room
            $meeting = $this->room->latestMeeting;

            // Do not create a new meeting, if there is already a running meeting and it is not detached
            if ($meeting && $meeting->end == null && $meeting->detached == null) {
                Log::info('Room {room} already has running meeting', ['room' => $this->room->getLogLabel()]);

                $lock->release();
                abort(CustomStatusCodes::ROOM_ALREADY_RUNNING->value, __('app.errors.room_already_running'));
            }

            // No running meeting found, or the meeting is detached
            Log::info('Room {room} not running, creating a new meeting', ['room' => $this->room->getLogLabel()]);
            if ($this->room->roomTypeInvalid) {
                $lock->release();
                Log::warning('Failed to create meeting for room {room}; invalid room type', ['room' => $this->room->getLogLabel()]);
                abort(CustomStatusCodes::ROOM_TYPE_INVALID->value, __('app.errors.room_type_invalid'));
            }

            Log::info('Finding server with lowest usage for room {room}', ['room' => $this->room->getLogLabel()]);

            // Basic load balancing: get server with the lowest usage
            $loadBalancingService = new LoadBalancingService;
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
            $meeting = new Meeting;
            $meeting->record_attendance = $this->room->getRoomSetting('record_attendance');
            $meeting->record = $this->room->getRoomSetting('record');
            $meeting->server()->associate($server);
            $meeting->room()->associate($this->room);
            $meeting->save();

            $meetingService = new MeetingService($meeting);

            Log::info('Starting new meeting for room {room} on server {server}', ['room' => $this->room->getLogLabel(), 'server' => $server->getLogLabel()]);
            if (! $meetingService->start()) {
                // Creating Meeting failed, remove meeting
                $meeting->forceDelete();

                $lock->release();
                Log::error('Failed to start meeting for room {room} on server {server}', ['room' => $this->room->getLogLabel(), 'server' => $server->getLogLabel()]);
                abort(CustomStatusCodes::ROOM_START_FAILED->value, __('app.errors.room_start'));
            }

            Log::info('Successfully started new meeting for room {room} on server {server}', ['room' => $this->room->getLogLabel(), 'server' => $server->getLogLabel()]);

            // Set start time after successful api call, prevents server poller from ending a meeting that has been started
            // but the api call has not been completed yet therefore the meeting will not be found on the server
            // and the server poller will mark the meeting as ended immediately
            $meeting->start = date('Y-m-d H:i:s');
            $meeting->save();

            // Change latest meeting or the room to newly created meeting
            $this->room->latestMeeting()->associate($meeting);

            // Reset room usage data
            $this->room->participant_count = 0;
            $this->room->listener_count = 0;
            $this->room->voice_participant_count = 0;
            $this->room->video_count = 0;
            $this->room->save();

            RoomStarted::dispatch($this->room);

            $lock->release();
        } catch (LockTimeoutException $e) {
            abort(CustomStatusCodes::ROOM_START_FAILED->value, __('app.errors.room_start'));
        }

        $this->room->delete_inactive = null;
        $this->room->save();

        return $meetingService;
    }

    /**
     * Join a running meeting
     */
    public function join(): MeetingService
    {
        Log::info('Joining room {room}', ['room' => $this->room->getLogLabel()]);

        // Check if there is a meeting running for this room, accordingly to the local database
        $meeting = $this->room->latestMeeting;

        // No running meeting found
        if ($meeting == null || $meeting->end != null) {
            Log::warning('Failed to join meeting for room {room}; no running meeting found', ['room' => $this->room->getLogLabel()]);
            abort(CustomStatusCodes::ROOM_NOT_RUNNING->value, __('app.errors.not_running'));
        }

        $meetingService = new MeetingService($meeting);

        Log::info('Check if meeting {meeting} for room {room} is running on the BBB server', ['room' => $this->room->getLogLabel(), 'meeting' => $meeting->getLogLabel()]);

        try {
            // Check if meeting is running
            $meetingRunning = $meetingService->isRunning();
        } catch (\Exception $e) {
            Log::warning('Error checking if room {room} is running on the BBB server', ['room' => $this->room->getLogLabel()]);
            abort(CustomStatusCodes::JOIN_FAILED->value, __('app.errors.join_failed'));
        }

        // Check if the meeting is actually running on the server
        if (! $meetingRunning) {
            $meetingService->setEnd();
            Log::warning('Meeting {meeting} for room {room} is not running on the BBB server', ['room' => $this->room->getLogLabel(), 'meeting' => $meeting->getLogLabel()]);
            abort(CustomStatusCodes::ROOM_NOT_RUNNING->value, __('app.errors.not_running'));
        }

        Log::info('Meeting {meeting} for room {room} is running on the BBB server', ['room' => $this->room->getLogLabel(), 'meeting' => $meeting->getLogLabel()]);

        return $meetingService;
    }
}
