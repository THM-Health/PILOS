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
            'id'            => $this->id,
            'filename'      => $this->filename,
            'download'      => $this->download,
            'useinmeeting'  => $this->useinmeeting,
            'default'       => $this->default,
            'uploaded'      => $this->created_at->format('d.m.Y H:i'),
            'url'           => $this->downloadLink()
        ];
    }
}
