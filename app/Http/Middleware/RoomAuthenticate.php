<?php

namespace App\Http\Middleware;

use App\Room;
use Closure;
use Illuminate\Support\Facades\Auth;

class RoomAuthenticate
{
    /**
     * Handle requests to room routes and determine room unauthenticated status
     *
     * This middleware checks if a user is owner, member, has a valid access token or non is required
     * If any of these rules fail, the user isn't authenticated and the middleware param allowAuthenticated
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
        if ($room->accessCode == null || (Auth::user() && ($room->owner->is(Auth::user()) || $room->members->contains(Auth::user()) || Auth::user()->can('viewAll', Room::class)))) {
            $authenticated = true;
        }

        // request provided access code
        if ($request->headers->has('Access-Code')) {
            $accessCode = $request->header('Access-Code');
            // check if access code is correct
            if (is_numeric($accessCode) && $room->accessCode == $accessCode) {
                $authenticated = true;
            } else {
                // access code is incorrect
                abort(401, 'invalid_code');
            }
        }

        // user is not  authenticated and should not continue with the request
        if (!$allowAuthenticated && !$authenticated) {
            abort(403, 'require_code');
        }

        $request->merge(['authenticated' => $authenticated]);

        return $next($request);
    }
}
