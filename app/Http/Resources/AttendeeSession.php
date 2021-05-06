<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AttendeeSession extends JsonResource
{
    /**
     * @param  \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id'       => $this['id'],
            'join'     => $this['join'],
            'leave'    => $this['leave'],
            'duration' => $this['duration'],
        ];
    }
}
