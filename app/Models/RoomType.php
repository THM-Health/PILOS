<?php

namespace App\Models;

use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RoomType extends Model
{
    use AddsModelNameTrait, HasFactory;

    protected $casts = [
        'allow_listing'           => 'boolean',
        'restrict'                => 'boolean',
        'max_participants'        => 'integer',
        'max_duration'            => 'integer',
        'require_access_code'     => 'boolean',
        'allow_record_attendance' => 'boolean',
        'allow_record'            => 'boolean',
    ];

    protected $fillable = ['name','color', 'restrict'];

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }

    /**
     * Roles which can create and have rooms with this type.
     *
     * @return BelongsToMany
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    public function serverPool()
    {
        return $this->belongsTo(ServerPool::class);
    }
}
