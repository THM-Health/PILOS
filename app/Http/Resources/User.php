<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class User extends JsonResource
{
    private $withPermissions;

    public function __construct($resource, $withPermissions = false)
    {
        parent::__construct($resource);

        $this->withPermissions = $withPermissions;
    }

    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        if (is_null($this->resource)) {
            return [];
        }

        return [
            'id'        => $this->id,
            'firstname' => $this->firstname,
            'lastname'  => $this->lastname,
            'locale'    => $this->locale,
            $this->mergeWhen($this->withPermissions, [
                'permissions' => $this->getAllPermissions()->map(function ($permission) {
                    return $permission->name;
                })
            ]),
            'modelName' => $this->modelName
        ];
    }
}
