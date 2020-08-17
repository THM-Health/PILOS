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
}
