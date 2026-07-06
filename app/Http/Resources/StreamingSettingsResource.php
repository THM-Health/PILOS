<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\RoomType;
use App\Settings\StreamingSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StreamingSettingsResource extends JsonResource
{
    public function __construct()
    {
        parent::__construct(null);
    }

    /**
     * @param  Request  $request
     * @return array
     */
    public function toArray($request)
    {
        $settings = app(StreamingSettings::class);

        $roomTypes = [];
        foreach (RoomType::with('streamingSettings')->get() as $roomType) {
            $roomTypes[] = [
                'id' => $roomType->id,
                'name' => $roomType->name,
                'streaming_settings' => new RoomTypeStreamingSettingsResource($roomType->streamingSettings),
            ];
        }

        return [
            'default_pause_image' => $settings->default_pause_image,
            'css_file' => $settings->css_file,
            'join_parameters' => $settings->join_parameters,
            'room_types' => $roomTypes,
        ];
    }
}
