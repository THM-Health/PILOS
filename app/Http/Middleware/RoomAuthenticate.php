<?php

namespace App\Http\Middleware;

use App\Enums\RoomGuestAuthenticationTokenType;
use App\Models\Room;
use App\Models\RoomGuestAuthenticationToken;
use App\Services\RoomAuthService;
use Closure;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RoomAuthenticate
{
    protected RoomAuthService $roomAuthService;

    public function __construct(RoomAuthService $roomAuthService)
    {
        $this->roomAuthService = $roomAuthService;
    }

    /**
     * Handle requests to room routes and determine room unauthenticated status
     *
     * This middleware checks if a user is owner, member, has a valid access token or non is required
     * If any of these rules fail, the user isn't authenticated and the middleware param allowAuthenticated
     * decides what to do
     *
     * If an access code is provided, but is invalid an error is return and the request isn't continued.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  bool  $allowUnAuthenticated  Allow users that are unauthenticated to pass
     * @return mixed
     */
    public function handle($request, Closure $next, $allowUnAuthenticated = false)
    {
        $authenticated = false;
        $room = $request->route('room');
        $token = null;
        $authToken = null;

        // requested user is the owner or a member of the room
        if (Auth::user() && ($room->owner->is(Auth::user()) || $room->members->contains(Auth::user()) || Auth::user()->can('viewAll', Room::class))) {
            $authenticated = true;
        }

        if ($request->has('auth_token')) {
            $authToken = RoomGuestAuthenticationToken::where('session_id', $request->session()->getId())
                ->where('room_id', $room->id)
                ->find($request->get('auth_token'));

            if ($authToken == null) {
                abort(401, 'invalid_token');
            }

            // Validate if token is still valid
            if ($authToken->type == RoomGuestAuthenticationTokenType::CODE) {
                if ($authToken->code != $room->access_code) {
                    $authToken->delete();
                    abort(401, 'invalid_token');
                }
            }

            // Authenticated with token
            if ($authToken->type == RoomGuestAuthenticationTokenType::TOKEN) {
                $authenticated = true;
                $token = $authToken->token;
            }
        }

        // user is not authenticated and room is not allowed for guests
        if (! $room->getRoomSetting('allow_guests') && ! $authenticated && ! Auth::user()) {
            Log::notice('Room guest access failed for room {room}', ['room' => $room->getLogLabel()]);

            abort(403, 'guests_not_allowed');
        }

        // if room has no access code
        if ($room->access_code == null) {
            $authenticated = true;
        }

        // request provided access code
        if ($authToken) {
            if ($authToken->type == RoomGuestAuthenticationTokenType::CODE) {
                $authenticated = true;
            }

        }

        // user is not authenticated and should not continue with the request
        if (! $allowUnAuthenticated && ! $authenticated) {
            abort(403, 'require_code');
        }

        // make authentication status and token available to other parts of the application
        $this->roomAuthService->setAuthenticated($room, $authenticated);
        $this->roomAuthService->setRoomToken($room, $token);

        return $next($request);
    }
}
