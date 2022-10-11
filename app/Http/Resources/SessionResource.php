<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Session */
class SessionResource extends JsonResource
{
    /**
     * @param  Request $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'last_activity' => $this->last_activity,
            'ip_address'    => $this->ip_address,
            'user_agent'    => $this->user_agent,
            'current'       => $this->id === session()->getId()
        ];
    }
}
