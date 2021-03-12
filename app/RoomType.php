<?php

namespace App;

use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Model;

class RoomType extends Model
{
    use AddsModelNameTrait;

    protected $casts = [
        'allow_listing' => 'boolean',
        'restrict' => 'boolean'
    ];

    protected $fillable = ['short','description','color', 'restrict'];

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    public function serverPool()
    {
        return $this->belongsTo(ServerPool::class);
    }
}
