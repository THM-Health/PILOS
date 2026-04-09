<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

/** @see Permission */
class PermissionResourceCollection extends ResourceCollection
{
    /**
     * @param  Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'data' => $this->collection->map(function (PermissionResource $permissionResource) {
                return $permissionResource->withIncludedPermissions();
            })->all(),
        ];
    }
}
