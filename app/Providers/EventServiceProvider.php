<?php

namespace App\Providers;

use App\Listeners\FailedLoginAttempt;
use App\Listeners\SetUserModelDefaults;
use App\Listeners\SetUserModelLdapAuthenticatorType;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use LdapRecord\Laravel\Events\Import\Importing;

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
        Importing::class => [
            SetUserModelLdapAuthenticatorType::class,
            SetUserModelDefaults::class
        ],
        Failed::class => [
            FailedLoginAttempt::class,
        ]
    ];

    /**
     * Register any events for your application.
     *
     * @return void
     */
    public function boot()
    {
        //
    }
}
