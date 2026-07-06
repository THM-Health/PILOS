<?php

// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Listeners;

use App\Prometheus\Counter;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Log;

class SuccessfulLogin
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(Login $event): void
    {
        $guard = $event->guard;

        // Update the last login timestamp
        $event->user->last_login = now();
        $event->user->save();

        // Log successful authentication
        if ($guard == 'users') {
            Counter::get('login_total')->inc('local');
            Log::info('Local user {user} has been successfully authenticated.', ['user' => $event->user->getLogLabel()]);
        }
        if ($guard == 'ldap') {
            Counter::get('login_total')->inc('ldap');
            Log::info('External user {user} has been successfully authenticated.', ['user' => $event->user->getLogLabel(), 'type' => 'ldap']);
        }
    }
}
