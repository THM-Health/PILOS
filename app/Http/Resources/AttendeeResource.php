<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendeeResource extends JsonResource
{
    /**
     * @param  Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'name' => $this['name'],
            'email' => $this['email'],
            'duration' => $this['duration'],
            'sessions' => AttendeeSessionResource::collection($this['sessions']),
        ];
    }
}
