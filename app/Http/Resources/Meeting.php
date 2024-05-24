<?php

namespace App\Http\Resources;

use App\Settings\RecordingSettings;
use Illuminate\Http\Resources\Json\JsonResource;

class Meeting extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'start' => $this->start,
            'end' => $this->end,
            'attendance' => $this->attendees()->count() > 0,
            'statistical' => app(RecordingSettings::class)->meeting_usage_enabled && $this->stats()->count() > 0,
        ];
    }
}
