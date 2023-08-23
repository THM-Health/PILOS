<?php

namespace App\Auth\Shibboleth;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ShibbolethSessionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response) $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // check if user is logged in via shibboleth
        if (\Auth::user() && session('external_auth') == 'shibboleth') {
            // check if user still has a valid shibboleth session and that it didn't change in the meantime
            $headerName = config('services.shibboleth.session_id_header');
            if (!$request->hasHeader($headerName) || session('shibboleth_session_id') != $request->header($headerName)) {
                \Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }
        }

        return $next($request);
    }
}
