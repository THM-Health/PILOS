<?php

namespace App\Models;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Enums\RoomVisibility;
use App\Exceptions\RoomIdGenerationFailed;
use App\Services\RoomAuthService;
use App\Settings\GeneralSettings;
use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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
                        throw new RoomIdGenerationFailed;
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

    protected function casts()
    {
        $casts = [
            'expert_mode' => 'boolean',
            'delete_inactive' => 'datetime',
            'access_code' => 'integer',
        ];

        // Generate casts for settings that are also present in the room type
        foreach (Room::ROOM_SETTINGS_DEFINITION as $setting => $config) {
            $casts[$setting] = $config['cast'];
        }

        return $casts;
    }

    /**
     * Defines the room settings that are present in the room and the room type.
     * Is used in casts, when generating validation rules and in general when looping through all room settings.
     * cast: defines the type to which should be cast (must be set)
     * expert: defines if the setting is an expert setting or not (must be set)
     * only: limits the possible values for the validation to specific values of an enum (can be set when the type is an enum)
     */
    public const ROOM_SETTINGS_DEFINITION = [
        'mute_on_start' => [
            'cast' => 'boolean',
            'expert' => true,
        ],
        'lock_settings_disable_cam' => [
            'cast' => 'boolean',
            'expert' => true,
        ],
        'webcams_only_for_moderator' => [
            'cast' => 'boolean',
            'expert' => true,
        ],
        'lock_settings_disable_mic' => [
            'cast' => 'boolean',
            'expert' => true,
        ],
        'lock_settings_disable_private_chat' => [
            'cast' => 'boolean',
            'expert' => true,
        ],
        'lock_settings_disable_public_chat' => [
            'cast' => 'boolean',
            'expert' => true,
        ],
        'lock_settings_disable_note' => [
            'cast' => 'boolean',
            'expert' => true,
        ],
        'everyone_can_start' => [
            'cast' => 'boolean',
            'expert' => true,
        ],
        'allow_membership' => [
            'cast' => 'boolean',
            'expert' => true,
        ],
        'allow_guests' => [
            'cast' => 'boolean',
            'expert' => false,
        ],
        'lock_settings_hide_user_list' => [
            'cast' => 'boolean',
            'expert' => true,
        ],
        'default_role' => [
            'cast' => RoomUserRole::class,
            'expert' => true,
            'only' => [RoomUserRole::USER, RoomUserRole::MODERATOR],
        ],
        'lobby' => [
            'cast' => RoomLobby::class,
            'expert' => true,
        ],
        'visibility' => [
            'cast' => RoomVisibility::class,
            'expert' => true,
        ],
        'record_attendance' => [
            'cast' => 'boolean',
            'expert' => true,
        ],
        'record' => [
            'cast' => 'boolean',
            'expert' => true,
        ],
        'auto_start_recording' => [
            'cast' => 'boolean',
            'expert' => true,
        ],
    ];

    /**
     * Get the setting validation rules for the room setting with the given name.
     * Setting must be defined in the ROOM_SETTINGS_DEFINITION
     *
     * @param  string  $settingName  setting name of the setting
     * @return string[] setting rules for the setting
     *
     * @throws \Exception
     */
    public static function getRoomSettingValidationRule($settingName)
    {
        $rules = ['required'];

        // Throw Exception if setting not defined in ROOM_SETTINGS_DEFINITION
        if (! array_key_exists($settingName, self::ROOM_SETTINGS_DEFINITION)) {
            throw new \Exception('Trying to access invalid room setting validation rule '.$settingName);
        }

        $castType = self::ROOM_SETTINGS_DEFINITION[$settingName]['cast'];

        // Boolean
        if ($castType === 'boolean') {
            array_push($rules, 'boolean');
        }
        // Enum
        elseif (enum_exists($castType)) {

            $enumValidation = Rule::enum($castType);
            // Only some values allowed
            if (isset(self::ROOM_SETTINGS_DEFINITION[$settingName]['only'])) {
                $enumValidation = $enumValidation->only(self::ROOM_SETTINGS_DEFINITION[$settingName]['only']);
            }
            array_push($rules, $enumValidation);
        }
        // Room setting validation with invalid cast
        else {
            throw new \Exception('Trying to access room setting validation rule with invalid cast '.$settingName);
        }

        return $rules;
    }

    /**
     * Recordings
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
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

        return $this->getRoomSetting('default_role');
    }

    /**
     * Generate message for moderators inside the meeting
     *
     * @return string
     */
    public function getModeratorOnlyMessage()
    {
        $appName = app(GeneralSettings::class)->name;

        $message = __('rooms.invitation.room', ['roomname' => $this->name, 'platform' => $appName]).'<br>';
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
     * Get the current value of the room setting with the given name
     * Setting must be defined in the ROOM_SETTINGS_DEFINITION
     *
     * @param  string  $settingName  setting name of the setting
     * @return mixed
     *
     * @throws \Exception
     */
    public function getRoomSetting(string $settingName)
    {
        if (! array_key_exists($settingName, self::ROOM_SETTINGS_DEFINITION)) {
            throw new \Exception('Trying to access invalid room setting '.$settingName);
        }

        // If setting is enforced: always use room type default value
        if ($this->roomType[$settingName.'_enforced']) {
            return $this->roomType[$settingName.'_default'];
        }

        // If the expert mode is activated for the room, the user can set the value themselves: use room value
        if ($this->expert_mode) {
            return $this[$settingName];
        }

        // If the expert mode is deactivated for the room and the setting is a non-expert setting: use room value
        if (self::ROOM_SETTINGS_DEFINITION[$settingName]['expert'] === false) {
            return $this[$settingName];
        }

        // If the expert mode is deactivated for the room and the setting is an expert-setting: use room type default value
        return $this->roomType[$settingName.'_default'];
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

    public function streaming(): HasOne
    {
        return $this->hasOne(RoomStreaming::class, 'room_id', 'id')->withDefault(
            [
                'enabled' => false,
                'enabled_for_current_meeting' => false,
            ]
        )->chaperone('room');
    }
}
