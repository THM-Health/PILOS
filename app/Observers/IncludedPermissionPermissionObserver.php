<?php

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
