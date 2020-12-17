<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class Server extends JsonResource
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
            'id'                         => $this->id,
            'base_url'                   => $this->baseUrl,
            'salt'                       => $this->salt,
            'description'                => $this->description,
            'strength'                   => $this->strength,
            'status'                     => $this->status,
            'participant_count'          => $this->participant_count,
            'listener_count'             => $this->listener_count,
            'voice_participant_count'    => $this->voice_participant_count,
            'video_count'                => $this->video_count,
            'meeting_count'              => $this->meeting_count,
            'model_name'                 => $this->model_name,
            'updated_at'                 => $this->updated_at
        ];
    }
}
