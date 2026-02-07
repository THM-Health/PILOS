<?php

namespace App\Models;

use App\Enums\RoomUserRole;
use Illuminate\Database\Eloquent\Relations\Pivot;

class RoomRole extends Pivot
{
    protected $table = 'room_role';

    protected $casts = [
        'role' => RoomUserRole::class,
    ];
}
