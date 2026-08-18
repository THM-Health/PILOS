<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\RoomAuthTokenType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomAuthToken extends Model
{
    use HasFactory;
    use HasUuids;

    public $timestamps = false;

    protected $casts = [
        'type' => RoomAuthTokenType::class,
    ];

    protected $fillable = [
        'type',
        'room_id',
        'room_personalized_link_id',
        'session_id',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function personalizedLink()
    {
        return $this->belongsTo(RoomPersonalizedLink::class, 'room_personalized_link_id');
    }

    public function session()
    {
        return $this->belongsTo(Session::class);
    }
}
