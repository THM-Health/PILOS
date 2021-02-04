<?php

namespace App;

use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Model;

class RoomType extends Model
{
    use AddsModelNameTrait;

    protected $fillable = ['short','description','color'];

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }

    public function serverPool()
    {
        return $this->belongsTo(ServerPool::class);
    }
}
