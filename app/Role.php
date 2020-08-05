<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['name'];

    public function users()
    {
        return $this->belongsToMany('App\User', 'user_role', 'role_id', 'user_id');
    }

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
