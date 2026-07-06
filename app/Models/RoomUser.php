<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Models;

use App\Enums\RoomUserRole;
use Illuminate\Database\Eloquent\Relations\Pivot;

class RoomUser extends Pivot
{
    protected $casts = [
        'role' => RoomUserRole::class,
    ];
}
