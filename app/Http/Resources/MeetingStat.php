<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class MeetingStat extends JsonResource
{

    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id'                        => $this->id,
            'participant_count'         => $this->participant_count,
            'listener_count'            => $this->listener_count,
            'voice_participant_count'   => $this->voice_participant_count,
            'video_count'               => $this->video_count,
            'created_at'                => $this->created_at->format('Y-m-d H:i:s')
        ];
    }
}
