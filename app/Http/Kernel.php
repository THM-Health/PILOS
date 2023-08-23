<?php

namespace App\Http;

use App\Http\Middleware\EnsureModelNotStale;
use App\Http\Middleware\LogContext;
use App\Http\Middleware\RoomAuthenticate;
use App\Http\Middleware\RouteEnableIf;
use App\Http\Middleware\StoreSessionData;
use Illuminate\Foundation\Http\Kernel as HttpKernel;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

class Kernel extends HttpKernel
{
    /**
     * The application's global HTTP middleware stack.
     *
     * These middleware are run during every request to your application.
     *
     * @var array
     */
    protected $middleware = [
        \App\Http\Middleware\TrustHosts::class,
        \App\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,
        \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
        \App\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    ];

    /**
     * The application's route middleware groups.
     *
     * @var array
     */
    protected $middlewareGroups = [
        'web' => [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            \App\Http\Middleware\SetApplicationLocale::class,
            'shibboleth',
            'loggedin:ldap,users',
            StoreSessionData::class,
            LogContext::class,
        ],

        'api' => [
            EnsureFrontendRequestsAreStateful::class,
            \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
            'shibboleth',
            'loggedin:ldap,users',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            \App\Http\Middleware\SetApplicationLocale::class,
            LogContext::class,
        ],
    ];

    /**
     * The application's middleware aliases.
     *
     * Aliases may be used to conveniently assign middleware to routes and groups.
     *
     * @var array
     */
    protected $middlewareAliases = [
        'auth'                  => \App\Http\Middleware\Authenticate::class,
        'auth.basic'            => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
        'cache.headers'         => \Illuminate\Http\Middleware\SetCacheHeaders::class,
        'can'                   => \Illuminate\Auth\Middleware\Authorize::class,
        'guest'                 => \App\Http\Middleware\RedirectIfAuthenticated::class,
        'password.confirm'      => \Illuminate\Auth\Middleware\RequirePassword::class,
        'signed'                => \Illuminate\Routing\Middleware\ValidateSignature::class,
        'throttle'              => \Illuminate\Routing\Middleware\ThrottleRequests::class,
        'verified'              => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
        'room.authenticate'     => RoomAuthenticate::class,
        'loggedin'              => \App\Http\Middleware\LoggedInUser::class,
        'check.stale'           => EnsureModelNotStale::class,
        'enable_if'             => RouteEnableIf::class,
        'shibboleth'            => \App\Auth\Shibboleth\ShibbolethSessionMiddleware::class,
    ];
}
