<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class User extends JsonResource
{
    /**
     * @var bool Indicates whether user permissions should be included or not.
     */
    private $withPermissions = false;

    /**
     * @var bool Indicates whether user roles should be included or not.
     */
    private $withoutRoles = false;

    /**
     * User resource constructor.
     *
     * @param  \App\Models\User  $resource  The user model that should be transformed.
     */
    public function __construct($resource)
    {
        parent::__construct($resource);
    }

    /**
     * Sets the flag to also load the permissions of the user model.
     *
     * @return $this The user resource instance.
     */
    public function withPermissions()
    {
        $this->withPermissions = true;

        return $this;
    }

    /**
     * Sets the flag to not load the roles of the user model.
     *
     * @return $this The user resource instance.
     */
    public function withoutRoles()
    {
        $this->withoutRoles = true;

        return $this;
    }

    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array
     */
    public function toArray($request)
    {
        if (is_null($this->resource)) {
            return [];
        }

        return [
            'id' => $this->id,
            'authenticator' => $this->authenticator,
            'image' => $this->imageUrl,
            'email' => $this->email,
            'external_id' => $this->external_id,
            'firstname' => $this->firstname,
            'lastname' => $this->lastname,
            'user_locale' => $this->locale,
            'permissions' => $this->when($this->withPermissions, function () {
                return $this->permissions;
            }),
            'model_name' => $this->model_name,
            'room_limit' => $this->room_limit,
            'updated_at' => $this->updated_at,
            'roles' => $this->when(! $this->withoutRoles, function () {
                return new RoleCollection($this->roles);
            }),
            'bbb_skip_check_audio' => $this->bbb_skip_check_audio,
            'initial_password_set' => $this->initial_password_set,
            'timezone' => $this->timezone,
            'superuser' => $this->superuser,
        ];
    }
}
