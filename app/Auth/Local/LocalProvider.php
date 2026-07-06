<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Auth\Local;

use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\UserProvider;

class LocalProvider extends EloquentUserProvider implements UserProvider
{
    /**
     * Retrieve a user by the given credentials.
     *
     * @return Authenticatable|null
     */
    public function retrieveByCredentials(array $credentials)
    {
        $email = $credentials['email'] ?? null;

        // First we check if an email address was passed to the method
        if (empty($email)) {
            return;
        }

        // Next we try to retrieve the user by their email address
        // we convert the email address to lowercase before comparing with the lowercase email addresses in the database
        // this is to ensure that the email address is case-insensitive
        // we also ensure that the user is using the local authenticator
        $query = $this->newModelQuery();

        $query->where('authenticator', 'local')
            ->whereLike('email', $email);

        return $query->first();
    }
}
