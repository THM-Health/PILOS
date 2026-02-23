<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Role */
class Role extends JsonResource
{
    /**
     * @var bool Indicates whether user permissions should be included or not.
     */
    private $withPermissions = false;

    /**
     * Sets the flag to also load the permissions of the role model.
     *
     * @return $this The role resource instance.
     */
    public function withPermissions()
    {
        $this->withPermissions = true;

        return $this;
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'superuser' => $this->superuser,
            'updated_at' => $this->updated_at,
            'permissions' => $this->when($this->withPermissions, function () {
                return Permission::collection($this->permissions);
            }),
            'model_name' => $this->model_name,
            'room_limit' => $this->room_limit,
            'automatic' => $this->whenPivotLoaded('role_user', function () {
                return $this->resource->pivot->automatic;
            }),
        ];
    }
}
