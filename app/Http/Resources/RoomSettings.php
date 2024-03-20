<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RoomSettings extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        //        ToDo only send everything when expert mode enabled???
        return [
            'name' => $this->name,
            'expert_mode' => $this->expert_mode,

            'room_type' => (new RoomType($this->roomType))->withDefaultRoomSettings(),
            'access_code' => $this->access_code,
            'mute_on_start' => $this->getRoomSetting('mute_on_start'),
            'lock_settings_disable_cam' => $this->getRoomSetting('lock_settings_disable_cam'),
            'webcams_only_for_moderator' => $this->getRoomSetting('webcams_only_for_moderator'),
            'lock_settings_disable_mic' => $this->getRoomSetting('lock_settings_disable_mic'),
            'lock_settings_disable_private_chat' => $this->getRoomSetting('lock_settings_disable_private_chat'),
            'lock_settings_disable_public_chat' => $this->getRoomSetting('lock_settings_disable_public_chat'),
            'lock_settings_disable_note' => $this->getRoomSetting('lock_settings_disable_note'),
            'lock_settings_hide_user_list' => $this->getRoomSetting('lock_settings_hide_user_list'),
            'everyone_can_start' => $this->getRoomSetting('everyone_can_start'),
            'allow_guests' => $this->getRoomSetting('allow_guests'),
            'allow_membership' => $this->getRoomSetting('allow_membership'),
            'welcome' => $this->welcome,
            'short_description' => $this->short_description,
            'default_role' => $this->getRoomSetting('default_role'),
            'lobby' => $this->getRoomSetting('lobby'),
            'listed' => $this->listed,
            'record_attendance' => $this->record_attendance,
        ];
    }
}
