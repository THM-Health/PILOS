<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OAuthTokenResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->client->name,
            'scopes' => $this->scopes,
            'last_used_at' => $this->last_used_at,
            'created_at' => $this->created_at,
            'expires_at' => $this->expires_at,
        ];
    }
}
