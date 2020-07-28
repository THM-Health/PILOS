<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;

class RoomGuestProtection
{
    /**
     * Handle an incoming request.
     *
     * @param \Illuminate\Http\Request $request
     * @param \Closure $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        $room = $request->route('room');
        if (Auth::guest() && !$room->allowGuests) {
            abort(403);
        }

        return $next($request);
    }
}
