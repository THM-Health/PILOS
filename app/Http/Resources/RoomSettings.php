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
            'name'                               => $this->name,
            'room_type'                          => new RoomType($this->roomType),
            'access_code'                        => $this->access_code,
            'mute_on_start'                      => $this->mute_on_start,
            'lock_settings_disable_cam'          => $this->lock_settings_disable_cam,
            'webcams_only_for_moderator'         => $this->webcams_only_for_moderator,
            'lock_settings_disable_mic'          => $this->lock_settings_disable_mic,
            'lock_settings_disable_private_chat' => $this->lock_settings_disable_private_chat,
            'lock_settings_disable_public_chat'  => $this->lock_settings_disable_public_chat,
            'lock_settings_disable_note'         => $this->lock_settings_disable_note,
            'lock_settings_lock_on_join'         => $this->lock_settings_lock_on_join,
            'lock_settings_hide_user_list'       => $this->lock_settings_hide_user_list,
            'everyone_can_start'                 => $this->everyone_can_start,
            'allow_guests'                       => $this->allow_guests,
            'allow_membership'                   => $this->allow_membership,
            'welcome'                            => $this->welcome,
            'short_description'                  => $this->short_description,
            'default_role'                       => $this->default_role,
            'lobby'                              => $this->lobby,
            'listed'                             => $this->listed,
            'record_attendance'                  => $this->record_attendance,
            'record'                             => $this->record,
        ];
    }
}
