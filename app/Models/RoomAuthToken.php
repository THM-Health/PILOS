<?php

namespace App\Models;

use App\Enums\RoomAuthTokenType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomAuthToken extends Model
{
    use HasFactory;
    use HasUuids;

    protected $casts = [
        'type' => RoomAuthTokenType::class,
    ];

    protected $fillable = [
        'type',
        'code',
        'room_id',
        'room_token_id',
        'session_id',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function accessToken()
    {
        return $this->belongsTo(RoomToken::class, 'room_token_id', 'token');
    }

    public function session()
    {
        return $this->belongsTo(Session::class);
    }
}
