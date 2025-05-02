<?php

namespace App\Http\Resources;

use App\Models\RoomType;
use Illuminate\Http\Resources\Json\JsonResource;

class StreamingSettings extends JsonResource
{
    public function __construct()
    {
        parent::__construct(null);
    }

    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        $settings = app(\App\Settings\StreamingSettings::class);

        $roomTypes = [];
        foreach (RoomType::with('streamingSettings')->get() as $roomType) {
            $roomTypes[] = [
                'id' => $roomType->id,
                'name' => $roomType->name,
                'streaming_settings' => new RoomTypeStreamingSettings($roomType->streamingSettings),
            ];
        }

        return [
            'default_pause_image' => $settings->default_pause_image,
            'css_file' => $settings->css_file,
            'join_parameters' => $settings->join_parameters,
            'room_types' => $roomTypes,
        ];
    }
}
