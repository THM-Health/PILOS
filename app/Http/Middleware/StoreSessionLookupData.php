<?php

namespace App\Http\Middleware;

use App\Models\LookupSession;
use Auth;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StoreSessionLookupData
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::guest() && $request->session()->has('lookup_data')) {

            $data = $request->session()->get('lookup_data');

             LookupSession::updateOrCreate(
                [
                    'session_id' =>  $request->session()->getId(),
                    'key' => $data['key'],
                    'value' => $data['value']
                ]);

                $request->session()->forget('lookup_data');
        }

        return $next($request);
    }
}
