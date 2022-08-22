<?php

namespace App\Http\Middleware;

use App\Room;
use App\RoomToken;
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
     * @param  bool                     $allowUnAuthenticated Allow users that are unauthenticated to pass
     * @return mixed
     */
    public function handle($request, Closure $next, $allowUnAuthenticated = false)
    {
        $authenticated = false;
        $room          = $request->route('room');
        $token         = null;

        // requested user is the owner or a member of the room
        if (Auth::user() && ($room->owner->is(Auth::user()) || $room->members->contains(Auth::user()) || Auth::user()->can('viewAll', Room::class))) {
            $authenticated = true;
        }

        if (!Auth::user() && $request->headers->has('Token')) {
            $token             = RoomToken::where('token', $request->header('Token'))->where('room_id', $room->id)->first();

            if ($token == null) {
                abort(401, 'invalid_token');
            }

            $token->last_usage = now();
            $token->save();
            $authenticated = true;
        }

        // user is not authenticated and room is not allowed for guests
        if (!$room->allow_guests && !$authenticated && !Auth::user()) {
            abort(403, 'guests_not_allowed');
        }

        // if room has not access code
        if ($room->access_code == null) {
            $authenticated = true;
        }

        // request provided access code
        if ($request->headers->has('Access-Code')) {
            $accessCode = $request->header('Access-Code');
            // check if access code is correct
            if (is_numeric($accessCode) && $room->access_code == $accessCode) {
                $authenticated = true;
            } else {
                // access code is incorrect
                abort(401, 'invalid_code');
            }
        }

        // user is not  authenticated and should not continue with the request
        if (!$allowUnAuthenticated && !$authenticated) {
            abort(403, 'require_code');
        }

        $request->merge(['authenticated' => $authenticated, 'token' => $token]);

        return $next($request);
    }
}
