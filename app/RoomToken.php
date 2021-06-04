<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomToken extends Model
{
    /**
     * Room the token belongs to
     * @return BelongsTo
     */
    public function room()
    {
        return $this->belongsTo(Room::class);
    }
}
