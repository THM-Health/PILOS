<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingStat extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $guarded = [];

    protected $casts = [
        'participant_count' => 'integer',
        'listener_count' => 'integer',
        'voice_participant_count' => 'integer',
        'video_count' => 'integer',
    ];

    /**
     * Meeting the statistical data belongs to
     *
     * @return BelongsTo
     */
    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }
}
