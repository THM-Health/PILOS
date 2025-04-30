<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingStat extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $guarded = [];

    /**
     * Meeting the statistical data belongs to
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }

    protected function casts(): array
    {
        return [
            'participant_count' => 'integer',
            'listener_count' => 'integer',
            'voice_participant_count' => 'integer',
            'video_count' => 'integer',
        ];
    }
}
