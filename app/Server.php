<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Server extends Model
{
    public function rooms()
    {
        return $this->hasMany(Room::class, 'preferedServer');
    }
}
