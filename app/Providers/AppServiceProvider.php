<?php

namespace App\Providers;

use App\Auth\LDAP\LDAPUserSynchronizer;
use App\Auth\LDAP\LDAPUserAuthenticator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use LdapRecord\Laravel\LdapRecord;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        LdapRecord::authenticateUsersUsing(LDAPUserAuthenticator::class);
        LdapRecord::synchronizeUsersUsing(LDAPUserSynchronizer::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Paginator::useBootstrap();
        Schema::defaultStringLength(191);
    }
}
