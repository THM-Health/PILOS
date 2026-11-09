<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustHosts as Middleware;
use Illuminate\Support\Facades\Log;

class TrustHosts extends Middleware
{
    /**
     * Get the host patterns that should be trusted.
     *
     * An APP_URL without a host aborts the request on purpose, instead of trusting all hosts.
     *
     * @return array<int, string>
     */
    public function hosts(): array
    {
        $host = parse_url((string) config('app.url'), PHP_URL_HOST);

        if (! $host) {
            Log::critical('APP_URL is invalid, it must contain a scheme and a host', ['app_url' => config('app.url')]);
            abort(500);
        }

        return ['^'.preg_quote($host).'$'];
    }
}
