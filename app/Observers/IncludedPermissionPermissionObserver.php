<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Observers;

use App\Models\IncludedPermissionPermission;
use App\Models\User;

class IncludedPermissionPermissionObserver
{
    /**
     * Handle the IncludedPermissionPermission "created" event.
     */
    public function created(IncludedPermissionPermission $includedPermissionPermission): void
    {
        User::$clearPermissionCache = true;
    }

    /**
     * Handle the IncludedPermissionPermission "deleted" event.
     */
    public function deleted(IncludedPermissionPermission $includedPermissionPermission): void
    {
        User::$clearPermissionCache = true;
    }
}
