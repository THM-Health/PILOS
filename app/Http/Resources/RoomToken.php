<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RoomToken extends JsonResource
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
            'token'      => $this->token,
            'firstname'  => $this->firstname,
            'lastname'   => $this->lastname,
            'role'       => (int) $this->role,
            'expires'    => $this->expires,
            'last_usage' => $this->last_usage,
        ];
    }
}
