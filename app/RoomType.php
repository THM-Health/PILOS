<?php

namespace App;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class RoomType extends Model
{
    protected $fillable = ['short','description','color','default'];

    protected $casts = [
        'default'   => 'boolean',
    ];

    /**
     * Scope a query to only get the default room
     *
     * @param  Builder $query Query that should be scoped
     * @return Builder The scoped query
     */
    public function scopeDefault(Builder $query)
    {
        return $query->where('default', true)->first();
    }
}
