<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

/** @see \App\Models\RoomType */
class RoomTypeResourceCollection extends ResourceCollection
{
    private $withDefaultRoomSettings = false;

    private $withFeatures = false;

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
     * Sets the flag to also load the features
     *
     * @return $this The room type resource collection instance
     */
    public function withFeatures(): self
    {
        $this->withFeatures = true;

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

                if ($this->withFeatures) {
                    $resource->withFeatures();
                }

                return $resource;
            })->all(),
        ];
    }
}
