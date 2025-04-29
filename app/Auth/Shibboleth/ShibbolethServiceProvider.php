<?php

namespace App\Auth\Shibboleth;

use Illuminate\Foundation\Application;
use Illuminate\Support\ServiceProvider;

class ShibbolethServiceProvider extends ServiceProvider
{
    /**
     * Register the Shibboleth provider.
     */
    #[\Override]
    public function register(): void
    {
        $this->app->singleton(fn (Application $app): \App\Auth\Shibboleth\ShibbolethProvider => new ShibbolethProvider);
    }
}
