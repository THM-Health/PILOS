<?php

namespace App;

use Spatie\Permission\Contracts\Role as RoleContract;
use Spatie\Permission\Guard;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    /**
     * Find or create role by its name (and optionally guardName).
     *
     * @param string      $name
     * @param string|null $guardName
     * @param boolean     $default
     *
     * @return RoleContract
     */
    public static function findOrCreate(string $name, $guardName = null, $default = false): RoleContract
    {
        $guardName = $guardName ?? Guard::getDefaultName(static::class);

        $role = static::where('name', $name)->where('guard_name', $guardName)->where('default', $default)->first();

        if (! $role) {
            return static::query()->create(['name' => $name, 'guard_name' => $guardName, 'default' => $default]);
        }

        return $role;
    }

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::deleting(function ($role) {
            if ($role->default) {
                return false;
            }

            return true;
        });
    }
}
