<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class RoomFile extends Model
{
    protected $casts = [
        'default'          => 'boolean',
        'download'         => 'boolean',
        'useinmeeting'     => 'boolean',
    ];
}
