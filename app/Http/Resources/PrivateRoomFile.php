<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

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
            'url'           => URL::signedRoute('download.file', ['roomFile' => $this->id,'filename'=>$this->filename])
        ];
    }
}
