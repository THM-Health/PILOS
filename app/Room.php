<?php

namespace App;

use App\Enums\RoomUserRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Room extends Model
{
    public $incrementing = false;
    protected $keyType   = 'string';

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::creating(function ($model) {
            if (!$model->id) {
                $newId = null;
                while (true) {
                    $newId = implode('-', str_split(Str::lower(Str::random(9)), 3));
                    if (self::find($newId) == null) {
                        break;
                    }
                }

                $model->id = $newId;
            }
        });
    }

    protected $casts = [
        'muteOnStart'                    => 'boolean',
        'lockSettingsDisableCam'         => 'boolean',
        'webcamsOnlyForModerator'        => 'boolean',
        'lockSettingsDisableMic'         => 'boolean',
        'lockSettingsDisablePrivateChat' => 'boolean',
        'lockSettingsDisablePublicChat'  => 'boolean',
        'lockSettingsDisableNote'        => 'boolean',
        'everyoneCanStart'               => 'boolean',
        'allowMembership'                => 'boolean',
        'allowGuests'                    => 'boolean',
        'lockSettingsLockOnJoin'         => 'boolean',
        'lockSettingsHideUserList'       => 'boolean',
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

    public function meetings()
    {
        return $this->hasMany(Meeting::class);
    }

    public function files()
    {
        return $this->hasMany(RoomFile::class);
    }

    public function runningMeeting()
    {
        return $this->meetings()->whereNull('end')->orderByDesc('start')->first();
    }

    public function isModeratorOrOwner($user)
    {
        return $this->members()->wherePivot('role', RoomUserRole::MODERATOR)->get()->contains($user) || $this->owner->is($user);
    }

    public function getRole($user)
    {
        if ($user == null) {
            return RoomUserRole::GUEST;
        }

        if ($this->owner->is($user)) {
            return RoomUserRole::MODERATOR;
        }

        $member = $this->members()->find($user);
        if ($member) {
            return $member->pivot->role;
        }

        return $this->defaultRole;
    }

    public function getModeratorOnlyMessage()
    {
        $message =  'An '.$this->name.' mit PILOS teilnehmen<br>';
        $message .= 'Link: '.config('app.url').'rooms/'.$this->id;
        if ($this->accessCode != null) {
            $message .= '<br>Zugangscode: '.$this->accessCode;
        }

        return $message;
    }
}
