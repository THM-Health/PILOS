<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LastMeetingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
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
            'dial_in' => $this->when($this->end == null && ! in_array($this->dial_number, config('bigbluebutton.invalid_dial_numbers')), [
                'number' => $this->dial_number,
                'pin' => $this->voice_bridge,
            ]),
            'server_connection_issues' => $this->end == null && $this->server->error_count > 0,
        ];
    }
}
