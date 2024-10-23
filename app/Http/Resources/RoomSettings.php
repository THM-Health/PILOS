<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

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
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'name' => $this->name,
            'expert_mode' => $this->expert_mode,
            'welcome' => $this->expert_mode ? $this->welcome : '',
            'short_description' => $this->short_description,
            'access_code' => $this->access_code,
            'room_type' => (new RoomType($this->roomType))->withDefaultRoomSettings(),
            $this->merge($this->getRoomSettings()),
        ];
    }
}
