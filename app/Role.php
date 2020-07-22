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
     * @param string      $name      Name of the role
     * @param string|null $guardName Name of the guard
     * @param boolean     $default   Whether the role is a default application role or not (Default: false)
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
        // Prevent deletion of application default roles.
        static::deleting(function ($role) {
            if ($role->default) {
                return false;
            }

            return true;
        });
    }
}
