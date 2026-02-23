<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

/** @mixin \App\Models\RoomFile */
class PrivateRoomFile extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
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
