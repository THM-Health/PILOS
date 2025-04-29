<?php

namespace App\Models;

use App\Enums\RoomUserRole;
use Illuminate\Database\Eloquent\Relations\Pivot;

class RoomUser extends Pivot
{
    protected function casts(): array
    {
        return [
            'role' => RoomUserRole::class,
        ];
    }
}
