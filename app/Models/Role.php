<?php

namespace App\Models;

use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Collection;

/**
 * Class Role
 */
class Role extends Model
{
    use AddsModelNameTrait, HasFactory;

    /**
     * Fillable attributes.
     *
     * @var string[]
     */
    protected $fillable = ['name'];

    protected $casts = [
        'superuser' => 'boolean',
    ];

    /**
     * Users that have the role.
     *
     * @return BelongsToMany
     */
    public function users()
    {
        return $this->belongsToMany(User::class)->withPivot('automatic')->using(RoleUser::class);
    }

    /**
     * Permissions that are given to this role.
     *
     * @return BelongsToMany
     */
    public function permissions()
    {
        return $this->belongsToMany(Permission::class)->using(PermissionRole::class);
    }

    /**
     * Filters out restricted permissions from the given collection of permission IDs.
     *
     * @param  Collection  $permissionIDs  Collection of permission IDs to be filtered.
     * @return Collection Filtered collection of permission IDs that are not restricted.
     */
    public function filterRestrictedPermissions(Collection $permissionIDs): Collection
    {
        return $permissionIDs->filter(function ($permissionID) {
            // Find the permission by its ID
            $permission = Permission::find($permissionID);
            if ($permission === null) {
                return false;
            }

            // Get the list of restricted permissions from the configuration
            $restrictions = collect(config('permissions.restrictions'));

            // Check if the permission is not in the list of restricted permissions
            return $restrictions->doesntContain(function (string $restriction) use ($permission) {
                // If the restriction matches the permission name, it is restricted
                if ($restriction === $permission->name) {
                    return true;
                }

                // Split the restriction and permission names into groups and permissions
                $restrictionGroup = explode('.', $restriction, 2)[0];
                $restrictionPermission = explode('.', $restriction, 2)[1] ?? null;
                $permissionGroup = explode('.', $permission->name, 2)[0];

                // If the restriction applies to all permissions in the group, it is restricted
                return $restrictionPermission === '*' && $restrictionGroup === $permissionGroup;
            });
        });
    }

    /**
     * Types of rooms that can be used by the user of this role.
     *
     * @return BelongsToMany
     */
    public function roomTypes()
    {
        return $this->belongsToMany(RoomType::class);
    }

    /**
     * Scope a query to only get roles that have a name like the passed one.
     *
     * @param  Builder  $query  Query that should be scoped
     * @param  string  $name  Name to search for
     * @return Builder The scoped query
     */
    public function scopeWithName(Builder $query, $name)
    {
        return $query->whereLike('name', '%'.$name.'%');
    }
}
