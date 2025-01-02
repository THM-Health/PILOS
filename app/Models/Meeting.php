<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
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
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function server()
    {
        return $this->belongsTo(Server::class);
    }

    /**
     * Room this meeting belongs to
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Statistical data of this meeting
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function stats()
    {
        return $this->hasMany(MeetingStat::class);
    }

    /**
     * Attendees of this meeting
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function attendees()
    {
        return $this->hasMany(MeetingAttendee::class);
    }

    public function getLogLabel()
    {
        return $this->id;
    }
}
