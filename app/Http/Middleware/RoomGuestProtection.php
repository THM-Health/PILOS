<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;

class RoomGuestProtection
{
    /**
     * Prevent guests from accessing rooms that are not open for guests
     *
     * @param  \Illuminate\Http\Request $request
     * @param  \Closure                 $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        $room = $request->route('room');
        // If user is guest and room is not open for guests, return error
        if (Auth::guest() && !$room->allowGuests) {
            abort(403);
        }

        return $next($request);
    }
}
