<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RoomType extends JsonResource
{
    /**
     * @var bool Indicates whether all details should be included or not.
     */
    private $withDetails = false;

    /**
     * @var bool Indicates whether the features should be included or not.
     */
    private $withFeatures = false;

    /**
     * @var bool Indicates whether the default room settings should be included or not.
     */
    private $withDefaultRoomSettings = false;

    /**
     * Sets the flag to also load all details
     *
     * @return $this The room type resource instance.
     */
    public function withDetails(): self
    {
        $this->withDetails = true;

        return $this;
    }

    /**
     * Sets the flag to also load the features
     *
     * @return $this The room type resource instance.
     */
    public function withFeatures(): self
    {
        $this->withFeatures = true;

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
            'model_name' => $this->model_name,

            $this->mergeWhen($this->withDetails, [
                'server_pool' => new ServerPool($this->serverPool),
                'updated_at' => $this->updated_at,
                'restrict' => $this->restrict,
                'max_participants' => $this->max_participants,
                'max_duration' => $this->max_duration,
                'create_parameters' => $this->create_parameters,
                'roles' => new RoleCollection($this->roles),
            ]),

            $this->mergeWhen($this->withFeatures, [
                'features' => [
                    'streaming' => [
                        'enabled' => $this->streamingSettings->enabled,
                    ],
                ],
            ]),

            $this->mergeWhen($this->withDefaultRoomSettings, $this->getDefaultRoomSettings()),
        ];
    }
}
