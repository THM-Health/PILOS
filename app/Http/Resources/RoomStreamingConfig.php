<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomStreamingConfig extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'enabled' => $this->enabled,
            'url' => $this->url,
            'pause_image' => $this->pause_image,
            'room_type_default_pause_image' => $this->resource->room->roomType->streamingSettings->default_pause_image,
            'system_default_pause_image' => app(\App\Settings\StreamingSettings::class)->default_pause_image,
        ];
    }
}
