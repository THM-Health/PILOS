<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PermissionResource extends JsonResource
{
    /**
     * @var bool Indicates whether user permissions should be included or not.
     */
    private $withIncludedPermissions = false;

    /**
     * Sets the flag to also load the permissions of the role model.
     *
     * @return $this The role resource instance.
     */
    public function withIncludedPermissions()
    {
        $this->withIncludedPermissions = true;

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
        return [
            'id' => $this->id,
            'name' => $this->name,
            'included_permissions' => $this->when($this->withIncludedPermissions, function () {
                return $this->includedPermissions->pluck('id');
            }),
        ];
    }
}
