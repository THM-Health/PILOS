<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Session;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Session */
class SessionResource extends JsonResource
{
    /**
     * @param  Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'last_activity' => $this->last_activity,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'current' => $this->id === session()->getId(),
        ];
    }
}
