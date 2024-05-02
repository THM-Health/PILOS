<?php

namespace App\Models;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Exceptions\RoomIdGenerationFailed;
use App\Services\RoomAuthService;
use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class Room extends Model
{
    use AddsModelNameTrait, HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

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

            if (! $model->id) {
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

        static::deleting(function ($model) {
            $model->files->each->delete();
            $model->recordings->each->delete();
            \Storage::deleteDirectory($model->id);
        });
    }

    protected $casts = [
        'mute_on_start' => 'boolean',
        'lock_settings_disable_cam' => 'boolean',
        'webcams_only_for_moderator' => 'boolean',
        'lock_settings_disable_mic' => 'boolean',
        'lock_settings_disable_private_chat' => 'boolean',
        'lock_settings_disable_public_chat' => 'boolean',
        'lock_settings_disable_note' => 'boolean',
        'everyone_can_start' => 'boolean',
        'allow_membership' => 'boolean',
        'allow_guests' => 'boolean',
        'lock_settings_lock_on_join' => 'boolean',
        'lock_settings_hide_user_list' => 'boolean',
        'default_role' => RoomUserRole::class,
        'lobby' => RoomLobby::class,
        'access_code' => 'integer',
        'listed' => 'boolean',
        'record_attendance' => 'boolean',
        'record' => 'boolean',
        'auto_start_recording' => 'boolean',
        'delete_inactive' => 'datetime',
    ];

    /**
     * Recordings
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function recordings()
    {
        return $this->hasMany(Recording::class);
    }

    /**
     * Room owner
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function getLogLabel()
    {
        return $this->name.' ('.$this->id.')';
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
            if ($currentDefault->use_in_meeting == true) {
                return;
            }
            $currentDefault->default = false;
            $currentDefault->save();
        }
        // If any other files are found that are used in the next meeting, select the first one to become new default
        $newDefaultFile = $this->files()->firstWhere('use_in_meeting', true);
        if ($newDefaultFile != null) {
            $newDefaultFile->default = true;
            $newDefaultFile->save();
        }
    }

    /**
     * Room type
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function roomType()
    {
        return $this->belongsTo(RoomType::class);
    }

    /**
     * Members of the room
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function members()
    {
        return $this->belongsToMany(User::class)->using(RoomUser::class)->withPivot('role');
    }

    /**
     * Meetings
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function meetings()
    {
        return $this->hasMany(Meeting::class);
    }

    /**
     * Last meeting of the room
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function latestMeeting()
    {
        return $this->belongsTo(Meeting::class, 'meeting_id');
    }

    /**
     * Files
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function files()
    {
        return $this->hasMany(RoomFile::class);
    }

    /**
     * Personalized tokens.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function tokens()
    {
        return $this->hasMany(RoomToken::class);
    }

    /** Check if user is moderator of this room
     * @param  RoomToken|null  $token
     * @return bool
     */
    public function isModerator(?User $user)
    {
        $roomAuthService = app()->make(RoomAuthService::class);
        $token = $roomAuthService->getRoomToken($this);

        if ($user == null && $token != null) {
            return $token->room->is($this) && $token->role == RoomUserRole::MODERATOR;
        }

        return $user == null ? false : $this->members()->wherePivot('role', RoomUserRole::MODERATOR)->get()->contains($user);
    }

    /** Check if user is co owner of this room
     * @return bool
     */
    public function isCoOwner(?User $user)
    {
        return $user == null ? false : $this->members()->wherePivot('role', RoomUserRole::CO_OWNER)->get()->contains($user);
    }

    /**
     * Check if user is member of this room
     *
     * @return bool
     */
    public function isMember(?User $user)
    {
        $roomAuthService = app()->make(RoomAuthService::class);
        $token = $roomAuthService->getRoomToken($this);

        if ($user == null && $token != null) {
            return $token->room->is($this) && ($token->role == RoomUserRole::USER || $token->role == RoomUserRole::MODERATOR);
        }

        return $user == null ? false : $this->members->contains($user);
    }

    /**
     * Get role of the user
     */
    public function getRole(?User $user, ?RoomToken $token): RoomUserRole
    {
        if ($user == null) {
            if ($token) {
                return $token->role;
            }

            return RoomUserRole::GUEST;
        }

        if ($this->owner->is($user) || $user->can('rooms.manage')) {
            return RoomUserRole::OWNER;
        }

        $member = $this->members()->find($user);
        if ($member) {
            return $member->pivot->role;
        }

        return $this->default_role;
    }

    /**
     * Generate message for moderators inside the meeting
     *
     * @return string
     */
    public function getModeratorOnlyMessage()
    {
        $message = __('rooms.invitation.room', ['roomname' => $this->name, 'platform' => setting('name')]).'<br>';
        $message .= __('rooms.invitation.link').': '.config('app.url').'/rooms/'.$this->id;
        if ($this->access_code != null) {
            $message .= '<br>'.__('rooms.invitation.code').': '.implode('-', str_split($this->access_code, 3));
        }

        return $message;
    }

    /**
     * Indicates whether the type of the room is restricted for
     * specific roles and the room owner doesn't has this role.
     */
    public function getRoomTypeInvalidAttribute(): bool
    {
        return ! self::roomTypePermitted($this->owner, $this->roomType);
    }

    /**
     * Returns true if the passed owner has rights to create a room
     * with the passed room type.
     *
     * @param  $owner  User
     * @param  $roomType  RoomType
     */
    public static function roomTypePermitted(User $owner, ?RoomType $roomType): bool
    {
        if (empty($owner) || empty($roomType)) {
            return false;
        }

        if (! $roomType->restrict) {
            return true;
        }

        return count(array_intersect($roomType->roles->pluck('id')->all(), $owner->roles->pluck('id')->all())) > 0;
    }
}
