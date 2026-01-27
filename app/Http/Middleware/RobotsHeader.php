<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RobotsHeader
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $directives = [];

        // Add noindex to all requests except for the landing page "/"
        if ($request->path() !== '/') {
            $directives[] = 'noindex';
        }

        $response = $next($request);

        // If any directives were added, set the X-Robots-Tag header
        if ($directives) {
            $response->headers->set('X-Robots-Tag', implode(',', $directives));
        }

        return $response;
    }
}
