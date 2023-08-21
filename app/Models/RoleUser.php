<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class RoleUser extends Pivot
{
    protected $casts = ['automatic' => 'boolean'];

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
