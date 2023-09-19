<?php

namespace App\Http\Middleware;

use App\Models\SessionData;
use Auth;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Store temporary session data in the database
 */
class StoreSessionData
{
    /**
     * Handle an incoming request.
     *
     * @param \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response) $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if any session data is stored in the session
        if (!Auth::guest() && $request->session()->has('session_data')) {
            $dataSets = $request->session()->get('session_data');

            // Store the data in the database
            foreach ($dataSets as $dataSet) {
                SessionData::updateOrCreate(
                    [
                        'session_id' => $request->session()->getId(),
                        'key'        => $dataSet['key'],
                        'value'      => $dataSet['value']
                    ]
                );
            }

            // Remove the data from the session
            $request->session()->forget('session_data');
        }

        return $next($request);
    }
}
