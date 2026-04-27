<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\SessionData;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Store temporary session data in the database
 */
class StoreSessionData
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if any session data is stored in the session
        if (! Auth::guest() && session()->has('session_data')) {
            $dataSets = session()->get('session_data');

            // Store the data in the database
            foreach ($dataSets as $dataSet) {
                SessionData::updateOrCreate(
                    [
                        'session_id' => session()->getId(),
                        'key' => $dataSet['key'],
                        'value' => $dataSet['value'],
                    ]
                );
            }

            // Remove the data from the session
            session()->forget('session_data');
        }

        return $next($request);
    }
}
