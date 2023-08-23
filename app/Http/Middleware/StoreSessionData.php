<?php

namespace App\Http\Middleware;

use App\Models\SessionData;
use Auth;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StoreSessionData
{
    /**
     * Handle an incoming request.
     *
     * @param \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response) $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::guest() && $request->session()->has('session_data')) {
            $dataSets = $request->session()->get('session_data');

            foreach ($dataSets as $dataSet) {
                SessionData::updateOrCreate(
                    [
                        'session_id' => $request->session()->getId(),
                        'key'        => $dataSet['key'],
                        'value'      => $dataSet['value']
                    ]
                );
            }
            $request->session()->forget('session_data');
        }

        return $next($request);
    }
}
