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
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Check if the user is authenticated
        if (Auth::check()) {

            // API requests cannot be redirected, must be handled in the frontend
            if ($request->expectsJson()) {
                return new Response('Guests only.')->setStatusCode(420, 'Guests only');
            }

            // Redirect authenticated users to the rooms page
            return redirect('/rooms');
        }

        return $next($request);
    }
}
