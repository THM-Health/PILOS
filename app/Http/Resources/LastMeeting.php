<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Meeting */
class LastMeeting extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
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
