<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RoomType extends JsonResource
{
    /**
     * @var bool Indicates whether the server pool should be included or not.
     */
    private $withServerPool = false;

    /**
     * @var bool Indicates whether the roles should be included or not.
     */
    private $withRoles = false;

    /**
     * @var bool Indicates whether the default room settings should be included or not.
     */
    private $withDefaultRoomSettings = false;

    /**
     * Sets the flag to also load the server pool
     *
     * @return $this The server pool resource instance.
     */
    public function withServerPool(): self
    {
        $this->withServerPool = true;

        return $this;
    }

    /**
     * Sets the flag to also load the roles
     *
     * @return $this The room type resource instance.
     */
    public function withRoles(): self
    {
        $this->withRoles = true;

        return $this;
    }

    /**
     * Sets the flag to also load the default room settings
     *
     * @return $this The room type resource instance.
     */
    public function withDefaultRoomSettings(): self
    {
        $this->withDefaultRoomSettings = true;

        return $this;
    }

    public function getDefaultRoomSettings()
    {
        if (! $this->withDefaultRoomSettings) {
            return [];
        }

        return [
            'webcams_only_for_moderator_default' => $this->webcams_only_for_moderator_default,
            'webcams_only_for_moderator_enforced' => $this->webcams_only_for_moderator_enforced,
            'mute_on_start_default' => $this->mute_on_start_default,
            'mute_on_start_enforced' => $this->mute_on_start_enforced,
            'lock_settings_disable_cam_default' => $this->lock_settings_disable_cam_default,
            'lock_settings_disable_cam_enforced' => $this->lock_settings_disable_cam_enforced,
            'lock_settings_disable_mic_default' => $this->lock_settings_disable_mic_default,
            'lock_settings_disable_mic_enforced' => $this->lock_settings_disable_mic_enforced,
            'lock_settings_disable_private_chat_default' => $this->lock_settings_disable_private_chat_default,
            'lock_settings_disable_private_chat_enforced' => $this->lock_settings_disable_private_chat_enforced,
            'lock_settings_disable_public_chat_default' => $this->lock_settings_disable_public_chat_default,
            'lock_settings_disable_public_chat_enforced' => $this->lock_settings_disable_public_chat_enforced,
            'lock_settings_disable_note_default' => $this->lock_settings_disable_note_default,
            'lock_settings_disable_note_enforced' => $this->lock_settings_disable_note_enforced,
            'lock_settings_hide_user_list_default' => $this->lock_settings_hide_user_list_default,
            'lock_settings_hide_user_list_enforced' => $this->lock_settings_hide_user_list_enforced,
            'everyone_can_start_default' => $this->everyone_can_start_default,
            'everyone_can_start_enforced' => $this->everyone_can_start_enforced,
            'allow_guests_default' => $this->allow_guests_default,
            'allow_guests_enforced' => $this->allow_guests_enforced,
            'allow_membership_default' => $this->allow_membership_default,
            'allow_membership_enforced' => $this->allow_membership_enforced,
            'default_role_default' => $this->default_role_default,
            'default_role_enforced' => $this->default_role_enforced,
            'lobby_default' => $this->lobby_default,
            'lobby_enforced' => $this->lobby_enforced,
        ];
    }

    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'color' => $this->color,
            'allow_listing' => $this->allow_listing,
            'server_pool' => $this->when($this->withServerPool, function () {
                return new ServerPool($this->serverPool);
            }),
            'model_name' => $this->model_name,
            'updated_at' => $this->updated_at,
            'restrict' => $this->restrict,
            'max_participants' => $this->max_participants,
            'max_duration' => $this->max_duration,
            'require_access_code' => $this->require_access_code,
            'allow_record_attendance' => $this->allow_record_attendance,
            'roles' => $this->when($this->withRoles, function () {
                return new RoleCollection($this->roles);
            }),
            $this->mergeWhen($this->withDefaultRoomSettings, $this->getDefaultRoomSettings()),
        ];
    }
}
