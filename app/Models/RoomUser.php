<?php

namespace App\Models;

use App\Enums\RoomUserRole;
use Illuminate\Database\Eloquent\Relations\Pivot;

class RoomUser extends Pivot
{
    protected $casts = [
        'role' => RoomUserRole::class,
    ];
}
