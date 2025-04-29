<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

/** @see \App\Models\Permission */
class PermissionResourceCollection extends ResourceCollection
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    #[\Override]
    public function toArray($request)
    {
        return [
            'data' => $this->collection->map(fn (\App\Models\Permission $resource) => new Permission($resource)->withIncludedPermissions())->all(),
        ];
    }
}
