<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Providers;

use App\Models\Room;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Laravel\Fortify\Fortify;
use Response;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to the "home" route for your application.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(200)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });

        RateLimiter::for('password_reset', function (Request $request) {
            return Limit::perMinutes(30, 5)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('password_email', function (Request $request) {
            return Limit::perMinutes(30, 5)->by($request->user()?->id ?: $request->ip());
        });

        // Rate limit verify email requests
        RateLimiter::for('verify_email', function (Request $request) {
            return Limit::perMinutes(30, 5)->by($request->user()->id);
        });

        // Rate limit for changes to the current user profile, requiring to current password of the user if the user is editing himself
        // Prevent brute force attacks on the password
        RateLimiter::for('current_password', function (Request $request) {
            if (Auth::user()->is(User::find($request->route('user')))) {
                // Limit to 5 attempts per minute and user+ip, not blocking the real user
                return Limit::perMinute(5)->by($request->user()->id.'|'.$request->ip());
            }

            // If the user is not editing himself, no rate limit (use the default rate limit, see api rate limit)
            return Limit::none();
        });

        RateLimiter::for('room-enumeration', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->user()?->id ?: $request->ip())
                ->after(function (\Symfony\Component\HttpFoundation\Response $response) use ($request) {
                    // If the response is not a 404, do not count this request
                    if ($response->getStatusCode() !== 404) {
                        return false;
                    }

                    // Only count the request if the route parameter 'room' was not resolved to a Room model
                    // Prevent counting requests that are valid and return a 404 for other reasons
                    return ! ($request->route('room') instanceof Room);
                });
        });
    }
}
