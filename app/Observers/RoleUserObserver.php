<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Observers;

use App\Models\RoleUser;
use App\Models\User;

class RoleUserObserver
{
    /**
     * Handle the RoleUser "created" event.
     */
    public function created(RoleUser $roleUser): void
    {
        User::$clearPermissionCache = true;
    }

    /**
     * Handle the RoleUser "deleted" event.
     */
    public function deleted(RoleUser $roleUser): void
    {
        User::$clearPermissionCache = true;
    }
}
