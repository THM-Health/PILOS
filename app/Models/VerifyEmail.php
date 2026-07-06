<?php

// SPDX-FileCopyrightText: 2023 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VerifyEmail extends Model
{
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
