<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class Role extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'default'       => $this->default,
            'updated_at'    => $this->updated_at,
            'permissions'   => Permission::collection($this->whenLoaded('permissions')),
            'model_name'    => $this->model_name,
            'room_limit'    => $this->room_limit,
            'automatic'     => $this->whenPivotLoaded('role_user', function () {
                return $this->pivot->automatic;
            })
        ];
    }
}
