<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

/** @see \App\Models\RoomType */
class RoomTypeResourceCollection extends ResourceCollection
{
    private $withDefaultRoomSettings = false;

    /**
     * Sets the flag to also load the default room settings
     *
     * @return $this The room type resource collection instance
     */
    public function withDefaultRoomSettings(): self
    {
        $this->withDefaultRoomSettings = true;

        return $this;
    }

    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'data' => $this->collection->map(function (\App\Models\RoomType $roomType) {
                $resource = new RoomType($roomType);
                if ($this->withDefaultRoomSettings) {
                    $resource->withDefaultRoomSettings();
                }

                return $resource;
            })->all(),
        ];
    }
}
