<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Models;

use App\Enums\RecordingAccess;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Recording extends Model
{
    use HasFactory;

    /**
     * The "type" of the auto-incrementing ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    protected $casts = [
        'start' => 'datetime',
        'end' => 'datetime',
        'access' => RecordingAccess::class,
    ];

    public function getLogLabel()
    {
        return $this->description.' ['.$this->start->format('Y-m-d H:i').' - '.$this->end->format('Y-m-d H:i').'] ('.$this->id.')';
    }

    /**
     * Room the recording belongs to
     *
     * @return BelongsTo
     */
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Meeting the recording belongs to (if available)
     *
     * @return BelongsTo
     */
    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }

    /**
     * Formats of the recording (screenshare, notes, etc.)
     *
     * @return HasMany
     */
    public function formats()
    {
        return $this->hasMany(RecordingFormat::class)->chaperone();
    }

    /**
     * Delete recording from database and storage
     *
     * @return bool|null
     *
     * @throws \Exception
     */
    public function delete()
    {
        $response = parent::delete();
        // if delete successfully
        if ($response) {
            Storage::disk('recordings')->deleteDirectory($this->id);
        }

        return $response;
    }
}
