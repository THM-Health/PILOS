<?php

declare(strict_types=1);

namespace App\Http\Resources\External;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomTypeResource extends JsonResource
{
    public function getDefaultRoomSettings(): array
    {
        $settings = [];

        $settings['has_access_code_default'] = $this->has_access_code_default;
        $settings['has_access_code_enforced'] = $this->has_access_code_enforced;

        $settings['has_allow_guests_default'] = $this->has_allow_guests_default;
        $settings['has_allow_guests_enforced'] = $this->has_allow_guests_enforced;

        return $settings;
    }

    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,

            'room_settings' => $this->getDefaultRoomSettings(),
        ];
    }
}
