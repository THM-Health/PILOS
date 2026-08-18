<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class PrivateRoomFileResource extends JsonResource
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
            'filename' => $this->filename,
            'download' => $this->download,
            'use_in_meeting' => $this->use_in_meeting,
            'default' => $this->default,
            'uploaded' => $this->created_at,
            'url' => URL::signedRoute('rooms.files.download', ['room' => $this->room->id, 'file' => $this->id, 'filename' => $this->filename]),
        ];
    }
}
