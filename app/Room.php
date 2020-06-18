<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $casts = [
        'muteOnStart'                    => 'boolean',
        'lockSettingsDisableCam'         => 'boolean',
        'webcamsOnlyForModerator'        => 'boolean',
        'lockSettingsDisableMic'         => 'boolean',
        'lockSettingsDisablePrivateChat' => 'boolean',
        'lockSettingsDisablePublicChat'  => 'boolean',
        'lockSettingsDisableNote'        => 'boolean',
        'everyoneCanStart'               => 'boolean',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function roomType()
    {
        return $this->belongsTo(RoomType::class);
    }

    public function members()
    {
        return $this->belongsToMany(User::class)->withPivot('role');
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
