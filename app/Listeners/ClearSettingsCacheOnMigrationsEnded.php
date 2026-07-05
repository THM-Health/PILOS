<?php

// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Listeners;

use Illuminate\Database\Events\MigrationsEnded;
use Illuminate\Support\Facades\Artisan;

class ClearSettingsCacheOnMigrationsEnded
{
    /**
     * Handle the event.
     */
    public function handle(MigrationsEnded $event): void
    {
        // Clear spatie/laravel-settings cache
        Artisan::call('settings:clear-cache');
    }
}
