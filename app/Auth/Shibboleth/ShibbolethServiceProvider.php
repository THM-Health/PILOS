<?php

declare(strict_types=1);

namespace App\Auth\Shibboleth;

use Illuminate\Foundation\Application;
use Illuminate\Support\ServiceProvider;

class ShibbolethServiceProvider extends ServiceProvider
{
    /**
     * Register the Shibboleth provider.
     */
    public function register(): void
    {
        $this->app->singleton(ShibbolethProvider::class, function (Application $app) {
            return new ShibbolethProvider;
        });
    }
}
