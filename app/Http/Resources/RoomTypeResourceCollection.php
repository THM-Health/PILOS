<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\RoomType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

/** @see RoomType */
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
     * @param  Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'data' => $this->collection->map(function (RoomTypeResource $roomTypeResource) {
                if ($this->withDefaultRoomSettings) {
                    $roomTypeResource->withDefaultRoomSettings();
                }

                if ($this->withFeatures) {
                    $roomTypeResource->withFeatures();
                }

                return $roomTypeResource;
            })->all(),
        ];
    }
}
