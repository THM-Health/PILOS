<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

/** @see \App\Models\RoomFile */
class PrivateRoomFileCollection extends ResourceCollection
{
    protected $default;

    public function __construct($resource, $default)
    {
        parent::__construct($resource);
        $this->default = $default;
    }

    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'data' => [
                'files' => $this->resource,
                'default' => $this->default ? $this->default->id : null,
            ],
        ];
    }
}
