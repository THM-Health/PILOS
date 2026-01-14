<?php

namespace App\Http\Middleware;

use Cache;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class FrontendVersion
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $manifestHash = Cache::flexible('vite-manifest-hash', [30, 60], function () {
            return Vite::manifestHash();
        });

        if ($manifestHash) {
            $response->headers->set('X-Frontend-Version', $manifestHash);
        }

        return $response;
    }
}
