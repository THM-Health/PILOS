<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // X-XSS-Protection
        // See https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html#x-xss-protection
        // Note: Do not enable as it can introduce vulnerabilities in otherwise secure applications
        // Modern browsers have deprecated this header in favor of Content Security Policy (CSP)
        $response->headers->set('X-XSS-Protection', 0);

        // X-Content-Type-Options
        // See https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html#x-content-type-options
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Referrer Policy
        // See https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html#referrer-policy
        $response->headers->set('Referrer-Policy', config('security.referrer_policy'));

        // Strict Transport Security
        if (config('security.hsts.enabled') && ! app()->isLocal()) {
            $hsts = 'max-age='.config('security.hsts.max_age');
            if (config('security.hsts.include_subdomains')) {
                $hsts .= '; includeSubDomains';
            }
            if (config('security.hsts.preload')) {
                $hsts .= '; preload';
            }
            $response->headers->set('Strict-Transport-Security', $hsts);
        }

        return $response;
    }
}
