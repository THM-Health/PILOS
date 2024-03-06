<?php

namespace App\Http\Middleware;

use Auth;
use Closure;
use Illuminate\Http\Request;
use Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Add details to all logs that are written during a request: IP address and the currently logged in user.
 */
class LogContext
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guest() ? 'guest' : Auth::user()->getLogLabel();

        Log::withContext([
            'ip' => $request->ip(),
            'current-user' => $user,
        ]);

        return $next($request);
    }
}
