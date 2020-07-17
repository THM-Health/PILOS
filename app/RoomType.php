<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class RoomType extends Model
{
    protected $casts = [
        'default'   => 'boolean',
    ];
}
