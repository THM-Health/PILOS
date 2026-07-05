<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Http\Resources;

use App\Settings\StreamingSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomStreamingConfigResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'enabled' => $this->enabled,
            'url' => $this->url,
            'pause_image' => $this->pause_image,
            'room_type_default_pause_image' => $this->resource->room->roomType->streamingSettings->default_pause_image,
            'system_default_pause_image' => app(StreamingSettings::class)->default_pause_image,
        ];
    }
}
