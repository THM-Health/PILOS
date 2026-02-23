<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServerStat extends Model
{
    protected $casts = [
        'participant_count' => 'integer',
        'listener_count' => 'integer',
        'voice_participant_count' => 'integer',
        'video_count' => 'integer',
        'meeting_count' => 'integer',
    ];

    /**
     * Server the statistical data belongs to
     */
    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }
}
