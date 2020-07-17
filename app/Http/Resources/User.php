<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class User extends JsonResource
{
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
            'guid'      => $this->guid,
            'lastname'  => $this->lastname,
            'locale'    => $this->locale,
            'username'  => $this->username,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at
        ];
    }
}
