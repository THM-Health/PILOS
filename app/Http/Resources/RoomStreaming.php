<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomStreaming extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'enabled_for_current_meeting' => $this->enabled_for_current_meeting,
            'status' => $this->status,
            'fps' => $this->fps,
        ];
    }
}
