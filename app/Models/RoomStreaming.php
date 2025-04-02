<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomStreaming extends Model
{
    protected $primaryKey = 'room_id';

    protected $table = 'room_streaming';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'room_id',
        'enabled',
        'enabled_for_current_meeting',
        'url',
        'pause_image',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'enabled_for_current_meeting' => 'boolean',
    ];

    protected $with = ['room'];

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'room_id', 'id');
    }

    // Override enabled attribute value to respect global streaming setting
    public function getEnabledAttribute($value): bool
    {
        return config('streaming.enabled') && $this->room->roomType->streamingSettings->enabled && $value;
    }
}
