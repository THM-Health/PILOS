<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class Meeting extends JsonResource
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
            'id'                => $this->id,
            'start'             => $this->start,
            'end'               => $this->end,
            'record_attendance' => $this->record_attendance,
        ];
    }
}
