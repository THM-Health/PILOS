<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class User extends JsonResource
{
    /**
     * @var bool Indicates whether user permissions should be included or not.
     */
    private $withPermissions;

    /**
     * User resource constructor.
     *
     * @param \App\User $resource        The user model that should be transformed.
     * @param bool      $withPermissions Indicates whether user permissions should be included or not (Default false).
     */
    public function __construct($resource, $withPermissions = false)
    {
        parent::__construct($resource);

        $this->withPermissions = $withPermissions;
    }

    /**
     * Transform the resource into an array.
     *
     * @param  Request $request
     * @return array
     */
    public function toArray($request)
    {
        if (is_null($this->resource)) {
            return [];
        }

        return [
            'id'            => $this->id,
            'authenticator' => $this->authenticator,
            'email'         => $this->email,
            'firstname'     => $this->firstname,
            'lastname'      => $this->lastname,
            'username'      => $this->username,
            'guid'          => $this->guid,
            'locale'        => $this->locale,
            'permissions'   => $this->when($this->withPermissions, $this->permissions),
            'modelName'     => $this->modelName,
            'room_limit'    => $this->room_limit,
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at,
        ];
    }
}
