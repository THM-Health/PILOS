<?php

declare(strict_types=1);

namespace App\Http\Resources\External;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'image' => $this->imageUrl,
            'email' => $this->email,
            'firstname' => $this->firstname,
            'lastname' => $this->lastname,
            'locale' => $this->locale,
            'room_limit' => $this->room_limit,
            'timezone' => $this->timezone,
        ];
    }
}
