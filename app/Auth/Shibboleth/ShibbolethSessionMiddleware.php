<?php

namespace App\Auth\Shibboleth;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware checking for users that are logged in via shibboleth
 * if they still have a valid shibboleth session and that it didn't change in the meantime
 * If the session is invalid or changed, the user is logged out
 */
class ShibbolethSessionMiddleware
{
    public function __construct(protected ShibbolethProvider $provider) {}

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // check if user is logged in via shibboleth
        if (\Auth::user()?->authenticator == 'shibboleth') {
            // check if user still has a valid shibboleth session and that it didn't change in the meantime
            $headerName = config('services.shibboleth.session_id_header');
            if (! $request->hasHeader($headerName) || session('shibboleth_session_id') != $this->provider->hashShibbolethSessionId($request->header($headerName))) {
                \Auth::logout();

                return redirect($this->provider->logout(url('/logout?message=session_expired')));
            }
        }

        return $next($request);
    }
}
