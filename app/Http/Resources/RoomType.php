<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RoomType extends JsonResource
{

    /**
     * @var bool Indicates whether the server pool should be included or not.
     */
    private $withServerPool = false;

    /**
     * Sets the flag to also load the server pool
     *
     * @return $this The server pool resource instance.
     */
    public function withServerPool(): self
    {
        $this->withServerPool = true;

        return $this;
    }

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
            'short'         => $this->short,
            'description'   => $this->description,
            'color'         => $this->color,
            'allow_listing' => $this->allow_listing,
            'server_pool'   => $this->when($this->withServerPool, function () {
                return new ServerPool($this->serverPool);
            }),
            'model_name'    => $this->model_name,
            'updated_at'    => $this->updated_at
        ];
    }
}
