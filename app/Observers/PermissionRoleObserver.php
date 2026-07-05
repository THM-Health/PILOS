<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Observers;

use App\Models\PermissionRole;
use App\Models\User;

class PermissionRoleObserver
{
    /**
     * Handle the PermissionRole "created" event.
     */
    public function created(PermissionRole $permissionRole): void
    {
        User::$clearPermissionCache = true;
    }

    /**
     * Handle the PermissionRole "deleted" event.
     */
    public function deleted(PermissionRole $permissionRole): void
    {
        User::$clearPermissionCache = true;
    }
}
