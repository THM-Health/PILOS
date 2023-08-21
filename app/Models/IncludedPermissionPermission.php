<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class IncludedPermissionPermission extends Pivot
{
    protected static function booted(): void
    {
        static::created(function () {
            User::$clearPermissionCache = true;
        });

        static::deleted(function () {
            User::$clearPermissionCache = true;
        });
    }
}
