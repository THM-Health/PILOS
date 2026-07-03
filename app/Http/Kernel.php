<?php

declare(strict_types=1);

namespace App\Http;

use App\Auth\Shibboleth\ShibbolethSessionMiddleware;
use App\Http\Middleware\Authenticate;
use App\Http\Middleware\EncryptCookies;
use App\Http\Middleware\EnsureModelNotStale;
use App\Http\Middleware\FrontendVersion;
use App\Http\Middleware\LogContext;
use App\Http\Middleware\LoggedInUser;
use App\Http\Middleware\PreventRequestForgery;
use App\Http\Middleware\PreventRequestsDuringMaintenance;
use App\Http\Middleware\RedirectIfAuthenticated;
use App\Http\Middleware\RequestMetricsMiddleware;
use App\Http\Middleware\RobotsHeader;
use App\Http\Middleware\RoomAuthenticate;
use App\Http\Middleware\RouteEnableIfConfig;
use App\Http\Middleware\SetApplicationLocale;
use App\Http\Middleware\StoreSessionData;
use App\Http\Middleware\TrimStrings;
use App\Http\Middleware\TrustHosts;
use App\Http\Middleware\TrustProxies;
use Illuminate\Auth\Middleware\AuthenticateWithBasicAuth;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Auth\Middleware\EnsureEmailIsVerified;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Foundation\Http\Kernel as HttpKernel;
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Illuminate\Foundation\Http\Middleware\InvokeDeferredCallbacks;
use Illuminate\Foundation\Http\Middleware\ValidatePostSize;
use Illuminate\Http\Middleware\SetCacheHeaders;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Routing\Middleware\ValidateSignature;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;
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
        InvokeDeferredCallbacks::class,
        TrustHosts::class,
        TrustProxies::class,
        PreventRequestsDuringMaintenance::class,
        ValidatePostSize::class,
        TrimStrings::class,
        ConvertEmptyStringsToNull::class,
        RequestMetricsMiddleware::class,
        RobotsHeader::class,
    ];

    /**
     * The application's route middleware groups.
     *
     * @var array
     */
    protected $middlewareGroups = [
        'web' => [
            EncryptCookies::class,
            AddQueuedCookiesToResponse::class,
            StartSession::class,
            ShareErrorsFromSession::class,
            PreventRequestForgery::class,
            SubstituteBindings::class,
            SetApplicationLocale::class,
            'shibboleth',
            'loggedin:ldap,users',
            StoreSessionData::class,
            LogContext::class,
        ],

        'api' => [
            EnsureFrontendRequestsAreStateful::class,
            ThrottleRequests::class.':api',
            'shibboleth',
            'loggedin:ldap,users',
            SubstituteBindings::class,
            SetApplicationLocale::class,
            LogContext::class,
            FrontendVersion::class,
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
        'auth' => Authenticate::class,
        'auth.basic' => AuthenticateWithBasicAuth::class,
        'cache.headers' => SetCacheHeaders::class,
        'can' => Authorize::class,
        'guest' => RedirectIfAuthenticated::class,
        'password.confirm' => RequirePassword::class,
        'signed' => ValidateSignature::class,
        'throttle' => ThrottleRequests::class,
        'verified' => EnsureEmailIsVerified::class,
        'room.authenticate' => RoomAuthenticate::class,
        'loggedin' => LoggedInUser::class,
        'check.stale' => EnsureModelNotStale::class,
        'enable_if_config' => RouteEnableIfConfig::class,
        'shibboleth' => ShibbolethSessionMiddleware::class,
    ];
}
