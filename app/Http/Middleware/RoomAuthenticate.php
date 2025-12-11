<?php

namespace App\Http\Middleware;

use App\Enums\RoomAuthTokenType;
use App\Models\Room;
use App\Models\RoomAuthToken;
use App\Prometheus\Counter;
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
     * This middleware checks if a user is owner, member, has a valid room auth token or non is required
     * If any of these rules fail, the user isn't authenticated and the middleware param allowAuthenticated
     * decides what to do
     *
     * If a room auth token is provided, but is invalid an error is return and the request isn't continued.
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
        $roomAuthToken = null;

        // requested user is the owner or a member of the room
        if (Auth::user() && ($room->owner->is(Auth::user()) || $room->members->contains(Auth::user()) || Auth::user()->can('viewAll', Room::class))) {
            $authenticated = true;
        }

        // Retrieve room auth token if provided
        if ($request->has('room_auth_token')) {
            // Room Auth Token was provided
            $roomAuthToken = RoomAuthToken::where('id', $request->get('room_auth_token'))
                ->where('room_id', $room->id)
                ->where('session_id', $request->session()->getId())
                ->first();

            if ($roomAuthToken == null) {
                // Metrics and logging
                Counter::get('room_authentication_errors_total')->inc('room_auth_token_invalid');
                Log::notice('Room auth token authentication failed for room {room}', ['room' => $room->getLogLabel()]);

                if ($request->expectsJson()) {
                    abort(401, 'invalid_token');
                } else {
                    return response(view('file-error', [
                        'type' => 'invalid_token',
                    ]))->setStatusCode(401);
                }
            }
        }

        // Valid room auth token with type TOKEN was provided
        if ($roomAuthToken && $roomAuthToken->type === RoomAuthTokenType::TOKEN) {
            $authenticated = true;
            $token = $roomAuthToken->accessToken;
        }

        // user is not authenticated and room is not allowed for guests
        if (! $room->getRoomSetting('allow_guests') && ! $authenticated && ! Auth::user()) {
            Counter::get('room_authentication_errors_total')->inc('guest_access');

            Log::notice('Room guest access failed for room {room}', ['room' => $room->getLogLabel()]);

            abort(403, 'guests_not_allowed');
        }

        // if room has no access code
        if ($room->access_code == null) {
            $authenticated = true;
        }

        if ($roomAuthToken && $roomAuthToken->type === RoomAuthTokenType::CODE) {
            $authenticated = true;
        }

        // user is not authenticated and should not continue with the request
        if (! $allowUnAuthenticated && ! $authenticated) {
            if ($request->expectsJson()) {
                abort(403, 'require_token');
            } else {
                return response(view('file-error', [
                    'type' => 'require_token',
                ]))->setStatusCode(403);
            }
        }

        // make authentication status and token available to other parts of the application
        $this->roomAuthService->setAuthenticated($room, $authenticated);
        $this->roomAuthService->setRoomToken($room, $token);

        return $next($request);
    }
}
