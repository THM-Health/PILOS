<?php

namespace App\Providers;

use App\Auth\LDAP\SetUserLDAPRole;
use App\Auth\OIDC\OIDCExtendSocialite;
use App\Auth\SAML2\Saml2ExtendSocialite;
use App\Listeners\FailedLoginAttempt;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use LdapRecord\Laravel\Events\Import\Saved;
use SocialiteProviders\Manager\SocialiteWasCalled;
class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        Saved::class => [
            SetUserLDAPRole::class,
        ],
        Failed::class => [
            FailedLoginAttempt::class,
        ],
        SocialiteWasCalled::class => [
            Saml2ExtendSocialite::class.'@handle',
            OIDCExtendSocialite::class.'@handle'
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
