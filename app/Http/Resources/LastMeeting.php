<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class LastMeeting extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'start' => $this->start,
            'end' => $this->end,
            'detached' => $this->detached,
            'usage' => $this->when($this->end == null, [
                'participant_count' => $this->room->participant_count,
            ]),
            'server_connection_issues' => $this->end == null && $this->server->error_count > 0,
        ];
    }
}
