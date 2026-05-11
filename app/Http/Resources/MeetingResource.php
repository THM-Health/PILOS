<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Settings\RecordingSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeetingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
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
