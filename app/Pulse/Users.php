<?php

namespace App\Pulse;

use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;
use Laravel\Pulse\Contracts\ResolvesUsers;

class Users implements ResolvesUsers
{
    public function key(Authenticatable $user): int|string|null
    {
        return $user->getAuthIdentifier();
    }

    public function load(Collection $keys): ResolvesUsers
    {
        $this->resolvedUsers = User::findMany($keys);

        return $this;
    }

    public function find(int|string|null $key): object
    {
        $user = $this->resolvedUsers->first(fn ($user) => $this->key($user) == $key);

        return (object) [
            'name'   => $user->fullname ?? "ID: $key",
            'extra'  => $user->email ?? '',
            'avatar' => $user->imageUrl ?? url('images/default_profile.png'),
        ];
    }
}
