<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner');
    }

    public function shared()
    {
        return $this->belongsToMany(User::class)->withPivot('moderator');
    }

    public function preferedServer()
    {
        return $this->belongsTo(Server::class, 'preferedServer');
    }

    public function parentRoom()
    {
        return $this->belongsTo(self::class, 'parentMeetingID');
    }

    public function breakoutRooms()
    {
        return $this->hasMany(self::class, 'parentMeetingID');
    }
}
