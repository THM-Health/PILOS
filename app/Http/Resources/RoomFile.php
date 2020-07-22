<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class RoomFile extends JsonResource
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
            'filename'      => $this->filename,
            'url'           => URL::temporarySignedRoute('download.file', now()->addMinutes(30), ['roomFile' => $this->id,'filename'=>$this->filename,'check'=>true])
        ];
    }
}
