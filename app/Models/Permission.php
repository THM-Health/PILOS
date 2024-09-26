<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Class Permission
 */
class Permission extends Model
{
    use HasFactory;

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
        return $this->belongsToMany(Role::class)->using(PermissionRole::class);
    }

    /**
     * Permissions that are included in this permission
     *
     * @return BelongsToMany
     */
    public function includedPermissions()
    {
        return $this->belongsToMany(self::class, 'included_permissions', 'permission_id', 'included_permission_id')->using(IncludedPermissionPermission::class);
    }

    /**
     * Setup the permission include
     *
     * @param  string  $permissionName  Name of the permission
     * @param  string[]  $includedPermissionNames  Names of the permissions that should be included
     */
    public static function setIncludedPermissions($permissionName, $includedPermissionNames)
    {
        $permission = self::where('name', $permissionName)->firstOrFail();
        $includedPermissions = [];
        foreach ($includedPermissionNames as $includedPermissionName) {
            $includedPermission = self::where('name', $includedPermissionName)->firstOrFail();
            array_push($includedPermissions, $includedPermission->id);
        }
        $permission->includedPermissions()->sync($includedPermissions);
    }
}
