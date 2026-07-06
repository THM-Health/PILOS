<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Providers;

use App\Pulse\Users;
use App\Services\LocaleService;
use App\Services\StreamingServiceFactory;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Laravel\Pulse\Contracts\ResolvesUsers;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Paginator::useBootstrap();
        Schema::defaultStringLength(191);
    }

    public function register(): void
    {
        $this->app->singleton(LocaleService::class, function () {
            return new LocaleService(new Filesystem);
        });

        $this->app->singleton(ResolvesUsers::class, Users::class);

        $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
        $this->app->register(TelescopeServiceProvider::class);

        $this->app->singleton(StreamingServiceFactory::class, StreamingServiceFactory::class);
    }
}
