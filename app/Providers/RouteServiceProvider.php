<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

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
            if (\Auth::user()->is(User::find($request->route('user')))) {
                // Limit to 5 attempts per minute and user+ip, not blocking the real user
                return Limit::perMinute( 5)->by($request->user()->id.'|'.$request->ip());
            }

            // If the user is not editing himself, no rate limit (use the default rate limit, see api rate limit)
            return Limit::none();
        });
    }
}
