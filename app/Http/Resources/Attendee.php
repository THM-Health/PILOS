<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class Attendee extends JsonResource
{
    /**
     * @param  \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'name2'    => $this['name'],
            'email'    => $this['email'],
            'duration' => $this['duration'],
            'sessions' => AttendeeSession::collection($this['sessions'])
        ];
    }
}
