<?php

namespace App\Models;

use App\Enums\RoomGuestAuthenticationTokenType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RoomGuestAuthenticationToken extends Model
{
    use HasUuids;

    protected $casts = [
        'type' => RoomGuestAuthenticationTokenType::class,
    ];

    protected $fillable = [
        'type',
        'code',
        'room_token_id',
        'room_id',
        'session_id',
    ];

    public function token()
    {
        return $this->belongsTo(RoomToken::class, 'room_token_id', 'token');
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function session()
    {
        return $this->belongsTo(Session::class);
    }
}
