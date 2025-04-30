<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServerStat extends Model
{
    /**
     * Server the statistical data belongs to
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function server()
    {
        return $this->belongsTo(Server::class);
    }

    protected function casts(): array
    {
        return [
            'participant_count' => 'integer',
            'listener_count' => 'integer',
            'voice_participant_count' => 'integer',
            'video_count' => 'integer',
            'meeting_count' => 'integer',
        ];
    }
}
