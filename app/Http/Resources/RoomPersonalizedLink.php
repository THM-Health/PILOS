<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RoomPersonalizedLink extends JsonResource
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
            'id' => $this->id,
            'token' => $this->token,
            'firstname' => $this->firstname,
            'lastname' => $this->lastname,
            'role' => $this->role,
            'expires' => $this->expires,
            'last_usage' => $this->last_usage,
        ];
    }
}
