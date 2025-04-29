<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class RoleUser extends Pivot
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

    protected function casts(): array
    {
        return ['automatic' => 'boolean'];
    }
}
