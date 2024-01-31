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
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id'            => $this->id,
            'description'   => $this->description,
            'color'         => $this->color,
            'allow_listing' => $this->allow_listing,
            'server_pool'   => $this->when($this->withServerPool, function () {
                return new ServerPool($this->serverPool);
            }),
            'model_name'              => $this->model_name,
            'updated_at'              => $this->updated_at,
            'restrict'                => $this->restrict,
            'max_participants'        => $this->max_participants,
            'duration'                => $this->duration,
            'require_access_code'     => $this->require_access_code,
            'allow_record_attendance' => $this->allow_record_attendance,
            'roles'                   => $this->when($this->withRoles, function () {
                return new RoleCollection($this->roles);
            })
        ];
    }
}
