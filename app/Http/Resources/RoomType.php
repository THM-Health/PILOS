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

        $settings = [];

        foreach (\App\Models\Room::ROOM_SETTINGS_DEFINITION as $setting => $config) {
            $settings[$setting.'_default'] = $this[$setting.'_default'];
            $settings[$setting.'_enforced'] = $this[$setting.'_enforced'];
        }

        $settings['has_access_code_default'] = $this->has_access_code_default;
        $settings['has_access_code_enforced'] = $this->has_access_code_enforced;

        return $settings;
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
            'server_pool' => $this->when($this->withServerPool, function () {
                return new ServerPool($this->serverPool);
            }),
            'model_name' => $this->model_name,
            'updated_at' => $this->updated_at,
            'restrict' => $this->restrict,
            'max_participants' => $this->max_participants,
            'max_duration' => $this->max_duration,
            'create_meeting_plugin_config' => $this->create_meeting_plugin_config,
            'join_meeting_plugin_config' => $this->join_meeting_plugin_config,
            'roles' => $this->when($this->withRoles, function () {
                return new RoleCollection($this->roles);
            }),
            $this->mergeWhen($this->withDefaultRoomSettings, $this->getDefaultRoomSettings()),
        ];
    }
}
