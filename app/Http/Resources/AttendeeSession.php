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
            'join'     => $this['join']->format('Y-m-d H:i:s'),
            'leave'    => $this['leave']->format('Y-m-d H:i:s'),
            'duration' => $this['duration'],
        ];
    }
}
