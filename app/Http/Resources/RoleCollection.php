<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class RoleCollection extends ResourceCollection
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
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
