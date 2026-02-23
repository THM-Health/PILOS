<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Ramsey\Uuid\Uuid;

class Meeting extends Model
{
    use HasFactory, HasUuids;

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

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $guarded = [];

    protected $casts = [
        'start' => 'datetime',
        'end' => 'datetime',
        'record_attendance' => 'boolean',
        'record' => 'boolean',
        'detached' => 'datetime',
    ];

    /**
     * Generate a new UUID for the model.
     */
    public function newUniqueId(): string
    {
        return (string) Uuid::uuid4();
    }

    /**
     * Server the meeting is/should be running on
     */
    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    /**
     * Room this meeting belongs to
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Statistical data of this meeting
     */
    public function stats(): HasMany
    {
        return $this->hasMany(MeetingStat::class);
    }

    /**
     * Attendees of this meeting
     */
    public function attendees(): HasMany
    {
        return $this->hasMany(MeetingAttendee::class);
    }

    public function getLogLabel(): string
    {
        return $this->id;
    }
}
