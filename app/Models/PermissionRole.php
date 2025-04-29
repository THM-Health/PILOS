<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class PermissionRole extends Pivot
{
    #[\Override]
    protected static function booted(): void
    {
        static::created(function (): void {
            User::$clearPermissionCache = true;
        });

        static::deleted(function (): void {
            User::$clearPermissionCache = true;
        });
    }
}
