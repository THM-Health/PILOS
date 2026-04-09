<?php

declare(strict_types=1);

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateRoomTypeStreamingSettingsRequest;
use App\Http\Resources\RoomTypeStreamingSettingsResource;
use App\Models\RoomType;
use Illuminate\Support\Facades\Storage;

class RoomTypeStreamingController extends Controller
{
    public function view(RoomType $roomType)
    {
        return new RoomTypeStreamingSettingsResource($roomType->streamingSettings);
    }

    public function update(RoomType $roomType, UpdateRoomTypeStreamingSettingsRequest $request)
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

        return new RoomTypeStreamingSettingsResource($roomType->streamingSettings);
    }
}
