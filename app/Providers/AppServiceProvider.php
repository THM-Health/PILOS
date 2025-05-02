<?php

namespace App\Providers;

use App\Pulse\Users;
use App\Services\LocaleService;
use App\Services\RoomAuthService;
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

        $this->app->singleton(RoomAuthService::class, function () {
            return new RoomAuthService;
        });

        $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
        $this->app->register(TelescopeServiceProvider::class);

        $this->app->singleton(StreamingServiceFactory::class, StreamingServiceFactory::class);
    }
}
