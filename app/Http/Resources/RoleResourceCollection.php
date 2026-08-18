<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class RoleResourceCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @param  Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return $this->collection->map(function (RoleResource $roleResource) {
            return [
                'id' => $roleResource->id,
                'name' => $roleResource->name,
                'automatic' => $roleResource->whenPivotLoaded('role_user', function () use ($roleResource) {
                    return $roleResource->pivot->automatic;
                }),
                'superuser' => $roleResource->superuser,
            ];
        })->toArray();
    }
}
