<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

/** @see \App\Permission */
class PermissionResourceCollection extends ResourceCollection
{
    /**
     * @param  \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'data' => $this->collection->map(function (\App\Permission $resource) use ($request) {
                return (new Permission($resource))->withIncludedPermissions();
            })->all()
        ];
    }
}
