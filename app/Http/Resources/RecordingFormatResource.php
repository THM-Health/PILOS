<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class RecordingFormatResource extends JsonResource
{
    /**
     * @param  Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'format' => $this->format,
            'disabled' => $this->disabled,
            'url' => URL::route('rooms.recordings.formats.show', ['room' => $this->recording->room->id, 'recording' => $this->recording->id, 'format' => $this->id]),
        ];
    }
}
