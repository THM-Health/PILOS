<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Meeting */
class MeetingWithRoomAndServer extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'start' => $this->start,
            'end' => $this->end,
            'room' => [
                'id' => $this->room->id,
                'owner' => $this->room->owner->fullName,
                'name' => $this->room->name,
                'participant_count' => $this->room->participant_count,
                'listener_count' => $this->room->listener_count,
                'voice_participant_count' => $this->room->voice_participant_count,
                'video_count' => $this->room->video_count,
            ],
            'server' => [
                'id' => $this->server->id,
                'name' => $this->server->name,
            ],
        ];
    }
}
