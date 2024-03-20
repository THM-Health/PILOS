<?php

namespace App\Models;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Traits\AddsModelNameTrait;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RoomType extends Model
{
    use AddsModelNameTrait, HasFactory;

    protected $casts = [
        'allow_listing' => 'boolean',
        'restrict' => 'boolean',
        'max_participants' => 'integer',
        'max_duration' => 'integer',
        'require_access_code' => 'boolean',
        'allow_record_attendance' => 'boolean',
        'webcams_only_for_moderator_default' => 'boolean',
        'webcams_only_for_moderator_enforced' => 'boolean',
        'mute_on_start_default' => 'boolean',
        'mute_on_start_enforced' => 'boolean',
        'lock_settings_disable_cam_default' => 'boolean',
        'lock_settings_disable_cam_enforced' => 'boolean',
        'lock_settings_disable_mic_default' => 'boolean',
        'lock_settings_disable_mic_enforced' => 'boolean',
        'lock_settings_disable_private_chat_default' => 'boolean',
        'lock_settings_disable_private_chat_enforced' => 'boolean',
        'lock_settings_disable_public_chat_default' => 'boolean',
        'lock_settings_disable_public_chat_enforced' => 'boolean',
        'lock_settings_disable_note_default' => 'boolean',
        'lock_settings_disable_note_enforced' => 'boolean',
        'lock_settings_hide_user_list_default' => 'boolean',
        'lock_settings_hide_user_list_enforced' => 'boolean',
        'everyone_can_start_default' => 'boolean',
        'everyone_can_start_enforced' => 'boolean',
        'allow_guests_default' => 'boolean',
        'allow_guests_enforced' => 'boolean',
        'allow_membership_default' => 'boolean',
        'allow_membership_enforced' => 'boolean',
        'default_role_default' => RoomUserRole::class,
        'default_role_enforced' => 'boolean',
        'lobby_default' => RoomLobby::class,
        'lobby_enforced' => 'boolean',
    ];

    protected $fillable = ['name', 'color', 'restrict'];

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }

    /**
     * Roles which can create and have rooms with this type.
     *
     * @return BelongsToMany
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    public function serverPool()
    {
        return $this->belongsTo(ServerPool::class);
    }
}
