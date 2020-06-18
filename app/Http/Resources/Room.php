<?php

namespace App\Http\Resources;

use Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class Room extends JsonResource
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
            'id'          => $this->id,
            'name'        => $this->name,
            'owner'       => $this->owner->firstname.' '.$this->owner->lastname,
            'type'        => new RoomType($this->roomType),
            'publicID'    => $this->publicID,
            'accessCode'  => $this->when($this->owner->is(Auth::user()), $this->accessCode),
            'settings'    => $this->when($this->owner->is(Auth::user()), new RoomSettings($this)),
            'users'       => $this->when($this->owner->is(Auth::user()), RoomUser::collection($this->members)),
        ];
    }
}
