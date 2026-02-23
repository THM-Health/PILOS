<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ServerPool */
class ServerPool extends JsonResource
{
    /**
     * @var bool Indicates whether the servers should be included or not.
     */
    private $withServers = false;

    /**
     * Sets the flag to also load the servers
     *
     * @return $this The server pool resource instance.
     */
    public function withServers(): self
    {
        $this->withServers = true;

        return $this;
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'servers_count' => $this->servers()->count(),
            'servers' => $this->when($this->withServers, function () {
                return Server::collection($this->servers);
            }),
            'model_name' => $this->model_name,
            'updated_at' => $this->updated_at,
        ];
    }
}
