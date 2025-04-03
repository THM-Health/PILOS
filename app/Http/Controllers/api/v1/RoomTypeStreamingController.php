<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateRoomTypeStreamingSettings;
use App\Http\Resources\RoomTypeStreamingSettings;
use App\Models\RoomType;
use Illuminate\Support\Facades\Storage;

class RoomTypeStreamingController extends Controller
{
    public function view(RoomType $roomType)
    {
        return new RoomTypeStreamingSettings($roomType->streamingSettings);
    }

    public function update(RoomType $roomType, UpdateRoomTypeStreamingSettings $request)
    {
        $settings = $roomType->streamingSettings;
        $settings->enabled = $request->boolean('enabled');

        // Pause image
        if ($request->file('default_pause_image')) {
            $path = $request->file('default_pause_image')->store('images', 'public');
            $url = Storage::url($path);
            $settings->default_pause_image = url($url);
        } elseif ($request->has('default_pause_image') && $request->input('default_pause_image') == null) {
            // Note: Do not delete the file, so running livestreams depending on it are not affected
            $settings->default_pause_image = null;
        }

        $settings->save();

        return new RoomTypeStreamingSettings($roomType->streamingSettings);
    }
}
