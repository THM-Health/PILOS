<?php

namespace App\Providers;

use App\Services\LocaleService;
use App\Services\RoomAuthService;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

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
            return new LocaleService(new Filesystem());
        });

        $this->app->singleton(RoomAuthService::class, function () {
            return new RoomAuthService();
        });

        if ($this->app->environment('local')) {
            $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
            $this->app->register(TelescopeServiceProvider::class);
        }
    }
}
