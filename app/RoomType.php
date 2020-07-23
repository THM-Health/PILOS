<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class RoomType extends Model
{
    protected $fillable = ['short','description','color','default'];

    protected $casts = [
        'default'   => 'boolean',
    ];
}
