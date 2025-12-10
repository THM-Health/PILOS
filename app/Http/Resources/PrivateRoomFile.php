<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class PrivateRoomFile extends JsonResource
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
            'filename' => $this->filename,
            'download' => $this->download,
            'use_in_meeting' => $this->use_in_meeting,
            'default' => $this->default,
            'uploaded' => $this->created_at,
            'url' => URL::signedRoute('rooms.files.download', ['room' => $this->room->id, 'roomFile' => $this->id, 'filename' => $this->filename]),
        ];
    }
}
