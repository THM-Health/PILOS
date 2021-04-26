<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class MeetingAttendee extends Model
{
    protected $casts = [
        'join'  => 'datetime',
        'leave' => 'datetime'
    ];

    public $timestamps = false;

    /**
     * Meeting
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }

    /**
     * Authenticated user
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
