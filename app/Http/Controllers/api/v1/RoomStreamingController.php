<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\CustomStatusCodes;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateRoomStreamingSettings;
use App\Http\Resources\RoomStreaming;
use App\Http\Resources\RoomStreamingSettings;
use App\Models\Meeting;
use App\Models\Room;
use App\Services\StreamingServiceFactory;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\HttpException;

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

        $streaming->enabled = $request->boolean('enabled');
        $streaming->url = $request->input('url');

        // Pause image
        if ($request->file('pause_image')) {
            $path = $request->file('pause_image')->store('images', 'public');
            $url = Storage::url($path);
            $streaming->pause_image = url($url);
        } elseif ($request->has('pause_image') && $request->input('pause_image') == null) {
            // Note: Do not delete the file, so running livestreams depending on it are not affected
            $streaming->pause_image = null;
        }

        $streaming->save();

        return new RoomStreamingSettings($streaming);
    }

    public function status(Room $room)
    {
        $cacheKey = 'streaming-status-cache-'.$room->id;

        Cache::flexible($cacheKey, [floor(config('streaming.refresh_interval') / 2), config('streaming.refresh_interval')], function () use ($room) {
            try {
                $streamingService = $this->getStreamingService($room);
                $streamingService->getStatus();
                $room->streaming->refresh();

                return true;
            } catch (HttpException $exception) {
                // Meeting not running, ignore in status call
            }
        });

        return new RoomStreaming($room->streaming);
    }

    private function getStreamingService(Room $room)
    {
        $meeting = $room->latestMeeting;
        if (! $meeting || $meeting->end != null || $meeting->detached != null) {
            abort(CustomStatusCodes::ROOM_NOT_RUNNING->value, __('app.errors.streaming_meeting_not_running'));
        }

        return app(StreamingServiceFactory::class)::make($meeting);
    }

    public function start(Room $room)
    {
        $streaming = $room->streaming;

        // Check if streaming is enabled for the current meeting
        if (! $streaming->enabled_for_current_meeting) {
            abort(412, __('app.errors.streaming_not_enabled_for_current_meeting_error'));
        }

        $streamingService = $this->getStreamingService($room);

        if ($streamingService->start() === false) {
            abort(500, __('app.errors.streaming_error'));
        }
        $room->streaming->refresh();

        return new RoomStreaming($room->streaming);
    }

    public function stop(Room $room)
    {
        $streamingService = $this->getStreamingService($room);

        if ($streamingService->stop() === false) {
            abort(500, __('app.errors.streaming_error'));
        }
        $room->streaming->refresh();

        return new RoomStreaming($room->streaming);
    }

    public function pause(Room $room)
    {
        $streamingService = $this->getStreamingService($room);

        if ($streamingService->pause() === false) {
            abort(500, __('app.errors.streaming_error'));
        }
        $room->streaming->refresh();

        return new RoomStreaming($room->streaming);
    }

    public function resume(Room $room)
    {
        $streamingService = $this->getStreamingService($room);

        if ($streamingService->resume() === false) {
            abort(500, __('app.errors.streaming_error'));
        }
        $room->streaming->refresh();

        return new RoomStreaming($room->streaming);
    }
}
