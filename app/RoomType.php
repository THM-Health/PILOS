<?php

namespace App;

use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RoomType extends Model
{
    use AddsModelNameTrait, HasFactory;

    protected $casts = [
        'allow_listing' => 'boolean',
        'restrict'      => 'boolean'
    ];

    protected $fillable = ['short','description','color', 'restrict'];

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
