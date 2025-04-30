<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class Attendee extends JsonResource
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    #[\Override]
    public function toArray($request)
    {
        return [
            'name' => $this['name'],
            'email' => $this['email'],
            'duration' => $this['duration'],
            'sessions' => AttendeeSession::collection($this['sessions']),
        ];
    }
}
