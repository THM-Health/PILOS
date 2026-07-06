<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Pulse;

use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;
use Laravel\Pulse\Contracts\ResolvesUsers;

class Users implements ResolvesUsers
{
    /**
     * The resolved users.
     *
     * @var Collection<int, Authenticatable>
     */
    protected Collection $resolvedUsers;

    /**
     * Return a unique key identifying the user.
     */
    public function key(Authenticatable $user): int|string|null
    {
        return $user->getAuthIdentifier();
    }

    /**
     * Eager load the users with the given keys.
     *
     * @param  Collection<int, int|string|null>  $keys
     */
    public function load(Collection $keys): ResolvesUsers
    {
        $this->resolvedUsers = User::findMany($keys);

        return $this;
    }

    /**
     * Find the user with the given key.
     *
     * @return object{name: string, extra?: string, avatar?: string}
     */
    public function find(int|string|null $key): object
    {
        $user = $this->resolvedUsers->first(fn ($user) => $this->key($user) == $key);

        return (object) [
            'name' => $user->fullname ?? "ID: $key",
            'extra' => $user->email ?? '',
            'avatar' => $user->imageUrl ?? url('images/default_profile.png'),
        ];
    }
}
