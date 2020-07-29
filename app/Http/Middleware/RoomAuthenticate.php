<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;

class RoomAuthenticate
{
    /**
     * Handle requests to room routes and determine room unauthenticated status
     *
     * This middleware checks if a user is owner, member, has a valid access token or non is required
     * If any of these rules fail, the user isn' authenticated and the middleware param allowAuthenticated
     * decides what to do
     *
     * If an access code is provided, but is invalid an error is return and the request isn't continued.
     *
     * @param  \Illuminate\Http\Request $request
     * @param  \Closure                 $next
     * @param  bool                     $allowAuthenticated Allow users that are unauthenticated to pass
     * @return mixed
     */
    public function handle($request, Closure $next, $allowAuthenticated = false)
    {
        $authenticated = false;
        $room          = $request->route('room');

        // requested user is the owner or a member of the room or the room doesn't require access code
        if ($room->owner->is(Auth::user()) or $room->members->contains(Auth::user()) or $room->accessCode == null) {
            $authenticated = true;
        }

        // request provided access code
        if ($request->has('code')) {
            $accessCode = $request->code;
            // check if access code is correct
            if (is_numeric($accessCode) && $room->accessCode == $accessCode) {
                $authenticated = true;
            } else {
                // access code is incorrect
                abort(401, 'invalid_code');
            }
        }

        // user is authenticated and should not continue with the request
        if (!$allowAuthenticated && !$authenticated) {
            abort(403);
        }

        $request->merge(['authenticated' => $authenticated]);

        return $next($request);
    }
}
