<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

/** @mixin \App\Models\RoomFile */
class RoomFile extends JsonResource
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
            'uploaded' => $this->created_at,
            'url' => URL::signedRoute('rooms.files.download', ['room' => $this->room->id, 'file' => $this->id, 'filename' => $this->filename]),
        ];
    }
}
