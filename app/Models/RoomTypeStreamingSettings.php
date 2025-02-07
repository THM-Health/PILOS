<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomTypeStreamingSettings extends Model
{
    protected $primaryKey = 'room_type_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'room_type_id',
        'enabled',
        'default_pause_image',
    ];

    protected $casts = [
        'enabled' => 'boolean',
    ];

    protected $with = ['roomType'];

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class, 'room_type_id', 'id');
    }
}
