<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Room */
class RoomSettings extends JsonResource
{
    public function getRoomSettings()
    {
        $settings = [];

        foreach (\App\Models\Room::ROOM_SETTINGS_DEFINITION as $setting => $config) {
            $settings[$setting] = $this->getRoomSetting($setting);
        }

        return $settings;
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->name,
            'expert_mode' => $this->expert_mode,
            'welcome' => $this->expert_mode ? $this->welcome : '',
            'short_description' => $this->short_description,
            'access_code' => $this->access_code,
            'room_type' => new RoomType($this->roomType)->withDefaultRoomSettings()->withFeatures(),
            $this->merge($this->getRoomSettings()),
        ];
    }
}
