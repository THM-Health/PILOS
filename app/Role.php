<?php

namespace App;

use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Class Role
 * @package App
 */
class Role extends Model
{
    use AddsModelNameTrait;

    /**
     * Fillable attributes.
     *
     * @var string[]
     */
    protected $fillable = ['name'];

    protected $casts = [
        'default' => 'boolean'
    ];

    /**
     * Users that have the role.
     *
     * @return BelongsToMany
     */
    public function users()
    {
        return $this->belongsToMany('App\User')->withPivot('automatic')->using('App\RoleUser');
    }

    /**
     * Permissions that are given to this role.
     *
     * @return BelongsToMany
     */
    public function permissions()
    {
        return $this->belongsToMany('App\Permission');
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
}
