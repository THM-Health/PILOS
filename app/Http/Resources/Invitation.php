<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class Invitation extends JsonResource
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
            'id'            => $this->id,
            'email'         => $this->email,
            'invite_token'  => $this->invite_token,
            'registered_at' => $this->registered_at,
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at
        ];
    }
}
