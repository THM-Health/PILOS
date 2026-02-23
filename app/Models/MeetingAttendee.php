<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingAttendee extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $guarded = [];

    protected $casts = [
        'join' => 'datetime',
        'leave' => 'datetime',
    ];

    public $timestamps = false;

    /**
     * Meeting
     */
    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    /**
     * Authenticated user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
