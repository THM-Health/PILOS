<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServerStat extends Model
{
    protected $casts = [
        'participant_count'         => 'integer',
        'listener_count'            => 'integer',
        'voice_participant_count'   => 'integer',
        'video_count'               => 'integer',
        'meeting_count'             => 'integer',
    ];

    /**
     * Server the statistical data belongs to
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function server()
    {
        return $this->belongsTo(Server::class);
    }
}
