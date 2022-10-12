<?php

namespace App\Models;

use App\Traits\AddsModelNameTrait;
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
        'default' => 'boolean'
    ];

    /**
     * Users that have the role.
     *
     * @return BelongsToMany
     */
    public function users()
    {
        return $this->belongsToMany('App\Models\User')->withPivot('automatic')->using('App\Models\RoleUser');
    }

    /**
     * Permissions that are given to this role.
     *
     * @return BelongsToMany
     */
    public function permissions()
    {
        return $this->belongsToMany('App\Models\Permission');
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
