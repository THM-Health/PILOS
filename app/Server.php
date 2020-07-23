<?php

namespace App;

use BigBlueButton\BigBlueButton;
use Illuminate\Database\Eloquent\Model;

class Server extends Model
{
    public function rooms()
    {
        return $this->hasMany(Room::class, 'preferedServer');
    }

    public function bbb()
    {
        return new BigBlueButton($this->baseUrl, $this->salt);
    }
}
