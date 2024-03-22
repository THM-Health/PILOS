<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Class that enables a route if any config variable with
 * the given name contains a true boolean value.
 */
class RouteEnableIfConfig
{
    /**
     * Aborts the request with 404 if any config variable with the given name contains
     * a false boolean value and continues otherwise.
     *
     * @param  string  $configNames  The name of the config keys to check, multiple keys can be checked by separating them with a comma.
     * @return mixed
     */
    public function handle(Request $request, Closure $next, string $configNames)
    {
        $keys = explode(',', $configNames);
        foreach ($keys as $key) {
            if (! config($key)) {
                abort(404);
            }
        }

        return $next($request);
    }
}
