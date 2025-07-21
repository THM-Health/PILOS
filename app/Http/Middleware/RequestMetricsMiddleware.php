<?php

namespace App\Http\Middleware;

use App\Prometheus\Counter;
use App\Prometheus\Summary;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RequestMetricsMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        return $next($request);
    }

    public function terminate(Request $request, $response)
    {
        // If metrics are disabled, skip the whole collection
        if (! config('metrics.enabled')) {
            return;
        }

        $startTime = defined('LARAVEL_START') ? LARAVEL_START : $request->server('REQUEST_TIME_FLOAT');

        $route = $request->route()?->uri() ?? 'unknown';

        if (config('metrics.collectors.request_duration_seconds.enabled') && ! in_array($route, config('metrics.collectors.request_duration_seconds.exclude_routes'))) {
            $duration = microtime(true) - $startTime;
            Summary::get('request_duration_seconds')->observe($duration);
        }

        if (config('metrics.collectors.request_memory_bytes.enabled') && ! in_array($route, config('metrics.collectors.request_memory_bytes.exclude_routes'))) {
            $memoryUsage = memory_get_peak_usage(true);
            Summary::get('request_memory_bytes')->observe($memoryUsage);
        }

        if (config('metrics.collectors.request_total.enabled') && ! in_array($route, config('metrics.collectors.request_total.exclude_routes'))) {
            $status = $response->getStatusCode();
            Counter::get('request_total')->inc([Str::of($status)->charAt(0).'xx']);
        }
    }
}
