<?php

// SPDX-FileCopyrightText: 2021 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeetingWithRoomAndServerResource extends JsonResource
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
            'room' => [
                'id' => $this->room->id,
                'owner' => $this->room->owner->fullName,
                'name' => $this->room->name,
                'participant_count' => $this->room->participant_count,
                'listener_count' => $this->room->listener_count,
                'voice_participant_count' => $this->room->voice_participant_count,
                'video_count' => $this->room->video_count,
            ],
            'server' => [
                'id' => $this->server->id,
                'name' => $this->server->name,
            ],
        ];
    }
}
