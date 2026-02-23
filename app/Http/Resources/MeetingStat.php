<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\MeetingStat */
class MeetingStat extends JsonResource
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
            'participant_count' => $this->participant_count,
            'listener_count' => $this->listener_count,
            'voice_participant_count' => $this->voice_participant_count,
            'video_count' => $this->video_count,
            'created_at' => $this->created_at,
        ];
    }
}
