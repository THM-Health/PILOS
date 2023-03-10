<?php
 
namespace App\Http\Middleware;
 
use Closure;
use Illuminate\Support\Facades\Vite;
 
class AddContentSecurityPolicyHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {

        if(Vite::isRunningHot()) {
            return $next($request);
        }

        Vite::useCspNonce();
 
        return $next($request)->withHeaders([
            'Content-Security-Policy' => "script-src 'unsafe-eval' 'nonce-".Vite::cspNonce()."'; style-src 'nonce-".Vite::cspNonce()."';",
        ]);
    }
}