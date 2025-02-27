<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\CustomStatusCodes;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateRoomStreamingSettings;
use App\Http\Resources\RoomStreamingSettings;
use App\Models\Meeting;
use App\Models\Room;
use App\Services\StreamingService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class RoomStreamingController extends Controller
{
    /**
     * Get the streaming configuration for the room
     */
    public function getConfig(Room $room)
    {
        return new RoomStreamingSettings($room->streaming);
    }

    public function updateConfig(Room $room, UpdateRoomStreamingSettings $request)
    {
        $streaming = $room->streaming;

        $streaming->enabled = $request->boolean('streaming_enabled');
        $streaming->url = $request->input('streaming_url');

        // Pause image
        if ($request->file('streaming_pause_image')) {
            $path = $request->file('streaming_pause_image')->store('images', 'public');
            $url = Storage::url($path);
            $streaming->pause_image = url($url);
        } elseif ($request->has('streaming_pause_image') && $request->input('streaming_pause_image') == null) {
            $streaming->pause_image = null;
        }

        $streaming->save();

        return new RoomStreamingSettings($streaming);
    }

    public function status(Room $room)
    {
        $cacheKey = 'streaming-status-'.$room->id;
        if (! Cache::has($cacheKey)) {
            Cache::add($cacheKey, true, config('streaming.refresh_interval'));
            $streamingService = $this->getStreamingService($room);
            $streamingService->getStatus();
            $room->streaming->refresh();
        }

        return new \App\Http\Resources\RoomStreaming($room->streaming);
    }

    private function getStreamingService(Room $room)
    {
        $meeting = $room->latestMeeting;
        if (! $meeting || $meeting->end != null || $meeting->detached != null) {
            abort(CustomStatusCodes::ROOM_NOT_RUNNING->value, __('app.errors.room_not_running'));
        }

        return new StreamingService($meeting);
    }

    public function start(Room $room)
    {
        $streaming = $room->streaming;

        // Check if streaming is enabled for the current meeting
        if (! $streaming->enabled_for_current_meeting) {
            // TODO: Return a proper error code and message
            abort(412);
        }

        $streamingService = $this->getStreamingService($room);

        if ($streamingService->start($streaming->pause_image, $streaming->url) === false) {
            abort(500);
        }
        $room->streaming->refresh();

        return new \App\Http\Resources\RoomStreaming($room->streaming);
    }

    public function stop(Room $room)
    {
        $streamingService = $this->getStreamingService($room);

        if ($streamingService->stop() === false) {
            abort(500);
        }
        $room->streaming->refresh();

        return new \App\Http\Resources\RoomStreaming($room->streaming);
    }

    public function pause(Room $room)
    {
        $streamingService = $this->getStreamingService($room);

        if ($streamingService->pause() === false) {
            abort(500);
        }
        $room->streaming->refresh();

        return new \App\Http\Resources\RoomStreaming($room->streaming);
    }

    public function resume(Room $room)
    {
        $streamingService = $this->getStreamingService($room);

        if ($streamingService->resume() === false) {
            abort(500);
        }
        $room->streaming->refresh();

        return new \App\Http\Resources\RoomStreaming($room->streaming);
    }
}
