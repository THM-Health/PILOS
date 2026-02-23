<?php

namespace App\Http\Resources;

use App\Settings\RecordingSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Meeting */
class Meeting extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
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
