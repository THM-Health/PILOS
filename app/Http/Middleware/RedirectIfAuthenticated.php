<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class RedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  bool|null  $redirectIfAuthenticated  Redirect authenticated users to dashboard
     * @return mixed
     */
    public function handle(Request $request, Closure $next, bool $redirectIfAuthenticated = false)
    {
        if (! Auth::guest()) {

            if ($redirectIfAuthenticated && ! $request->expectsJson()) {
                return redirect('/rooms');
            }

            return (new Response('Guests only.'))->setStatusCode(420, 'Guests only');
        }

        return $next($request);
    }
}
