<?php

namespace App\Http\Resources;

use App\Models\Recording;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Recording */
class RecordingResource extends JsonResource
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
            'description' => $this->description,
            'access' => $this->access,
            'formats' => RecordingFormatResource::collection($this->formats->sortBy('format')),
        ];
    }
}
