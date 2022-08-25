<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PrivateRoomFile extends JsonResource
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
            'id'              => $this->id,
            'filename'        => $this->filename,
            'download'        => $this->download,
            'use_in_meeting'  => $this->use_in_meeting,
            'default'         => $this->default,
            'uploaded'        => $this->created_at
        ];
    }
}
