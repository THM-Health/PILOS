<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Class that enables a route if any setting with
 * the given name contains a true boolean value.
 *
 * @package App\Http\Middleware
 */
class RouteEnableIfSetting
{
    /**
     * Aborts the request with 404 if any setting with the given name contains
     * a false boolean value and continues otherwise.
     *
     * @param  \Illuminate\Http\Request $request
     * @param  \Closure                 $next
     * @param  string                   $settingName The name of the setting to check, multiple settings can be checked by separating them with a comma.
     * @return mixed
     */
    public function handle(Request $request, Closure $next, string $settingName)
    {
        $settings = explode(',', $settingName);
        foreach ($settings as $setting) {
            if (!boolval(setting($setting))) {
                abort(404);
            }
        }

        return $next($request);
    }
}
