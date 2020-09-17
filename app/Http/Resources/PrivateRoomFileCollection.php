<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

/** @see \App\RoomFile */
class PrivateRoomFileCollection extends ResourceCollection
{
    protected $default;

    public function __construct($resource, $default)
    {
        parent::__construct($resource);
        $this->default = $default;
    }

    /**
     * @param  \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'data' => [
                'files'      => $this->resource,
                'default'    => $this->default ? $this->id : null,
                'file_mimes' => config('bigbluebutton.allowed_file_mimes'),
                'file_size'  => config('bigbluebutton.max_filesize') / 1000,
            ],
        ];
    }
}
