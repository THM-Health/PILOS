<?php

namespace App\Models;

use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Class Role
 * @package App
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
        'superuser' => 'boolean'
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
     * @param  Builder $query Query that should be scoped
     * @param  String  $name  Name to search for
     * @return Builder The scoped query
     */
    public function scopeWithName(Builder $query, $name)
    {
        return $query->where('name', 'like', '%' . $name . '%');
    }
}
