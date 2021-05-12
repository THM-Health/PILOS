<?php

namespace App;

use App\Enums\RoomUserRole;
use App\Exceptions\RoomIdGenerationFailed;
use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class Room extends Model
{
    use AddsModelNameTrait;

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
            // if the meeting has no ID yet, create a unique id
            // 36^9 possible room ids ≈ 10^14

            if (!$model->id) {
                $count_tries = 0;
                $newId = null;
                while (true) {
                    $count_tries++;
                    if ($count_tries >= config('bigbluebutton.room_id_max_tries')) {
                        throw new RoomIdGenerationFailed();
                    }

                    $newId = implode('-', str_split(Str::lower(Str::random(9)), 3));
                    if (DB::table('rooms')->where('id', 'LIKE', $newId)->doesntExist()) {
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
        'maxParticipants'                => 'integer',
        'duration'                       => 'integer',
        'defaultRole'                    => 'integer',
        'lobby'                          => 'integer',
        'accessCode'                     => 'integer',
        'listed'                         => 'boolean',
    ];

    /**
     * Room owner
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Correct the default file settings after every file setting change
     */
    public function updateDefaultFile()
    {
        // Check if a file is currently default
        $currentDefault = $this->files()->firstWhere('default', true);
        if ($currentDefault != null) {
            // If the default file is also used in the next meeting, it can stay the default, otherwise remove default
            // and look for alternative
            if ($currentDefault->useinmeeting == true) {
                return;
            }
            $currentDefault->default = false;
            $currentDefault->save();
        }
        // If any other files are found that are used in the next meeting, select the first one to become new default
        $newDefaultFile = $this->files()->firstWhere('useinmeeting', true);
        if ($newDefaultFile != null) {
            $newDefaultFile->default = true;
            $newDefaultFile->save();
        }
    }

    /**
     * Room type
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function roomType()
    {
        return $this->belongsTo(RoomType::class);
    }

    /**
     * Members of the room
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function members()
    {
        return $this->belongsToMany(User::class)->withPivot('role');
    }

    /**
     * Meetings
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function meetings()
    {
        return $this->hasMany(Meeting::class);
    }

    /**
     * Files
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function files()
    {
        return $this->hasMany(RoomFile::class);
    }

    /**
     * Get the newest running meeting
     * @return Meeting|null
     */
    public function runningMeeting()
    {
        return $this->meetings()->whereNull('end')->orderByDesc('start')->first();
    }

    /** Check if user is moderator of this room
     * @param $user User|null
     * @return bool
     */
    public function isModerator($user)
    {
        return $user == null ? false : $this->members()->wherePivot('role', RoomUserRole::MODERATOR)->get()->contains($user);
    }

    /** Check if user is co owner of this room
     * @param $user User|null
     * @return bool
     */
    public function isCoOwner($user)
    {
        return $user == null ? false : $this->members()->wherePivot('role', RoomUserRole::CO_OWNER)->get()->contains($user);
    }

    /**
     * Check if user is member of this room
     * @param $user User|null
     * @return bool
     */
    public function isMember($user)
    {
        return $user == null ? false : $this->members->contains($user);
    }

    /**
     * Get role of the user
     * @param $user|null
     * @return int|mixed
     */
    public function getRole($user)
    {
        if ($user == null) {
            return RoomUserRole::GUEST;
        }

        if ($this->owner->is($user) || $user->can('rooms.manage')) {
            return RoomUserRole::OWNER;
        }

        $member = $this->members()->find($user);
        if ($member) {
            return $member->pivot->role;
        }

        return $this->defaultRole;
    }

    /**
     * Generate message for moderators inside the meeting
     * @return string
     */
    public function getModeratorOnlyMessage()
    {
        $message =  __('rooms.invitation.room', ['roomname'=>$this->name]).'<br>';
        $message .= __('rooms.invitation.link', ['link'=>config('app.url').'rooms/'.$this->id]);
        if ($this->accessCode != null) {
            $message .= '<br>'.__('rooms.invitation.code', ['code'=>implode('-', str_split($this->accessCode, 3))]);
        }

        return $message;
    }

    /**
     * Indicates whether the type of the room is restricted for
     * specific roles and the room owner doesn't has this role.
     * @return bool
     */
    public function getRoomTypeInvalidAttribute(): bool
    {
        return !self::roomTypePermitted($this->owner, $this->roomType);
    }

    /**
     * Returns true if the passed owner has rights to create a room
     * with the passed room type.
     *
     * @param $owner User
     * @param $roomType RoomType
     * @return bool
     */
    public static function roomTypePermitted(User $owner, RoomType $roomType): bool
    {
        if (empty($owner) || empty($roomType) || !$roomType->restrict) {
            return true;
        }

        return count(array_intersect($roomType->roles->pluck('id')->all(), $owner->roles->pluck('id')->all())) > 0;
    }
}
