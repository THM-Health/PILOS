<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApiRedirectMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if ($response->isRedirection()) {
            return response()->json([
                'redirect' => $response->headers->get('Location'),
            ]);
        }

        return $response;
    }
}
