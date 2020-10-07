<?php

namespace App\Providers;

use App\Listeners\SetDefaultRoleForLdapUser;
use App\Listeners\SetUserModelDefaultLocale;
use App\Listeners\SetUserModelLdapAuthenticatorType;
use Illuminate\Auth\Events\Authenticated;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use LdapRecord\Laravel\Events\Importing;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        Authenticated::class => [
            SetDefaultRoleForLdapUser::class
        ],
        Importing::class => [
            SetUserModelLdapAuthenticatorType::class,
            SetUserModelDefaultLocale::class
        ],
    ];

    /**
     * Register any events for your application.
     *
     * @return void
     */
    public function boot()
    {
        parent::boot();

        //
    }
}
