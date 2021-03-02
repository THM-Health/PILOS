<?php

namespace App\Http\Middleware;

use Closure;

/**
 * Class that enables a route if the setting with
 * the given name contains a true boolean value.
 *
 * @package App\Http\Middleware
 */
class RouteEnableIf
{
    /**
     * Aborts the request with 404 if the setting with the given name contains
     * a false boolean value and continues otherwise.
     *
     * @param  \Illuminate\Http\Request $request
     * @param  \Closure                 $next
     * @return mixed
     */
    public function handle($request, Closure $next, $settingName)
    {
        if (!boolval(setting($settingName))) {
            abort(404);
        }

        return $next($request);
    }
}
