<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RoomSettings extends JsonResource
{

    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'name'                                  => $this->name,
            'roomType'                              => new RoomType($this->roomType),
            'accessCode'                            => $this->access_code,
            'muteOnStart'                           => $this->mute_on_start,
            'lockSettingsDisableCam'                => $this->lock_settings_disable_cam,
            'webcamsOnlyForModerator'               => $this->webcams_only_for_moderator,
            'lockSettingsDisableMic'                => $this->lock_settings_disable_mic,
            'lockSettingsDisablePrivateChat'        => $this->lock_settings_disable_private_chat,
            'lockSettingsDisablePublicChat'         => $this->lock_settings_disable_public_chat,
            'lockSettingsDisableNote'               => $this->lock_settings_disable_note,
            'lockSettingsLockOnJoin'                => $this->lock_settings_lock_on_join,
            'lockSettingsHideUserList'              => $this->lock_settings_hide_user_list,
            'everyoneCanStart'                      => $this->everyone_can_start,
            'allowGuests'                           => $this->allow_guests,
            'allowMembership'                       => $this->allow_membership,
            'welcome'                               => $this->welcome,
            'maxParticipants'                       => $this->max_participants,
            'duration'                              => $this->duration,
            'defaultRole'                           => $this->default_role,
            'lobby'                                 => $this->lobby,
            'listed'                                => $this->listed,
            'record_attendance'                     => $this->record_attendance,
        ];
    }
}
