<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Class Role
 * @package App
 */
class Role extends Model
{
    /**
     * Fillable attributes.
     *
     * @var string[]
     */
    protected $fillable = ['name'];

    /**
     * Users that have the role.
     *
     * @return BelongsToMany
     */
    public function users()
    {
        return $this->belongsToMany('App\User', 'user_role', 'role_id', 'user_id');
    }

    /**
     * Permissions that are given to this role.
     *
     * @return BelongsToMany
     */
    public function permissions()
    {
        return $this->belongsToMany('App\Permission', 'role_permission', 'role_id', 'permission_id');
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
