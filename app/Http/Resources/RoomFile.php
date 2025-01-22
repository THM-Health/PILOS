<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class RoomFile extends JsonResource
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
            'uploaded' => $this->created_at,
            'url' => URL::signedRoute('download.file', ['room' => $this->room->id, 'roomFile' => $this->id, 'filename' => $this->filename]),
        ];
    }
}
