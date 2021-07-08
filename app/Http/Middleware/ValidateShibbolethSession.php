<?php

namespace App\Http\Middleware;

use Closure;
use Session;

class ValidateShibbolethSession
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request $request
     * @param  \Closure                 $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        // check if user is logged in via shibboleth
        if (\Auth::user() && \Auth::user()->authenticator == 'shibboleth') {
            // check if user still has a valid shibboleth session and that it didn't change in the meantime
            if (!isset($_SERVER[config('shibboleth.sessionId')]) || session('Shib-Session-ID') != $_SERVER[config('shibboleth.sessionId')]) {
                \Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }
        }

        return $next($request);
    }
}
