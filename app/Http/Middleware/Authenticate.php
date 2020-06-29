<?php

namespace App\Http\Middleware;

use App\Http\Resources\User as UserResource;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * @param  \Illuminate\Http\Request $request
     * @return string|null
     */
    protected function redirectTo($request)
    {
        if (! $request->expectsJson()) {
            return URL::to('/login');
        }
    }

    protected function unauthenticated($request, array $guards)
    {
        if (Route::currentRouteName() === 'api.v1.currentUser') {
            return new UserResource(null);
        }

        parent::unauthenticated($request, $guards);
    }
}
