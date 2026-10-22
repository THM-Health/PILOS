<?php

declare(strict_types=1);

namespace App\Http\Resources\External;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'room_type' => new RoomTypeResource($this->roomType),
            'access_code' => $this->access_code,
            'allow_guests' => (bool) $this->allow_guests,
            'link' => rtrim(config('app.url'), '/').'/rooms/'.$this->id,
        ];
    }
}
