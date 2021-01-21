<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Class Permission
 * @package App
 */
class Permission extends Model
{
    /**
     * Fillable attributes.
     *
     * @var string[]
     */
    protected $fillable = ['name'];

    /**
     * Roles to which the permission is assigned.
     *
     * @return BelongsToMany
     */
    public function roles()
    {
        return $this->belongsToMany('App\Role');
    }

    public function inheritances()
    {
        return $this->belongsToMany(self::class, 'permission_inheritances', 'permission_id', 'inheritance_permission_id');
    }

    public static function SetupPermissionInheritances($permissionName, $permissionInheritanceNames)
    {
        $permission             = self::where('name', $permissionName)->firstOrFail();
        $permissionInheritances = [];
        foreach ($permissionInheritanceNames as $permissionInheritanceName) {
            $permissionInheritance = self::where('name', $permissionInheritanceName)->firstOrFail();
            array_push($permissionInheritances, $permissionInheritance->id);
        }
        $permission->inheritances()->sync($permissionInheritances);
    }
}
