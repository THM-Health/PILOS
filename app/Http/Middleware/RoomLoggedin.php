<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;

class RoomLoggedin
{
    /**
     * Handle an incoming request.
     *
     * @param \Illuminate\Http\Request $request
     * @param \Closure $next
     * @return mixed
     */
    public function handle($request, Closure $next, $allowUnauthorized = false)
    {

        $authorized = false;

        $room = $request->route('room');

        // requested user is the owner or a member of the room or the room doesn't require access code
        if ($room->owner->is(Auth::user()) or $room->members->contains(Auth::user()) or $room->accessCode == null) {
            $authorized = true;
        }

        // request provided access code
        if ($request->has('code')) {
            $accessCode = $request->code;
            // check if access code is correct
            if (is_numeric($accessCode) && $room->accessCode == $accessCode) {
                $authorized = true;
            } else {
                // access code is incorrect
                abort(401, 'invalid_code');
            }
        }

        if(!$allowUnauthorized && !$authorized)
            abort(403);

        $request->merge(['authorized' => $authorized]);

        return $next($request);
    }
}
