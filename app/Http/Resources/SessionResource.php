<?php

namespace App\Http\Resources;

use App\Models\Session;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Session */
class SessionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'last_activity' => $this->last_activity,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'current' => $this->id === session()->getId(),
        ];
    }
}
