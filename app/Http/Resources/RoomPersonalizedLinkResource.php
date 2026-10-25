<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomPersonalizedLinkResource extends JsonResource
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
            'id' => $this->id,
            'token' => $this->token,
            'description' => $this->description,
            'enforced_name' => $this->enforced_name,
            'role' => $this->role,
            'expires' => $this->expires,
            'last_usage' => $this->last_usage,
        ];
    }
}
