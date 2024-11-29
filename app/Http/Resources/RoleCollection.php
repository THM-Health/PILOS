<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class RoleCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @param  Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return $this->collection->map(function (Role $role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'automatic' => $role->whenPivotLoaded('role_user', function () use ($role) {
                    return $role->pivot->automatic;
                }),
                'superuser' => $role->superuser,
            ];
        })->toArray();
    }
}
