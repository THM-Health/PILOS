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
use Str;

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
            // ToDo validate input
            $providedRoomAuthToken = $request->get('room_auth_token');
            $providedRoomAuthTokenType = $request->get('room_auth_token_type') == null ? null : (int) $request->get('room_auth_token_type');

            // Check if provided room auth token is a valid UUID
            if (! Str::isUuid($providedRoomAuthToken)) {
                Counter::get('room_authentication_errors_total')->inc('room_auth_token_invalid');
                Log::notice('Room auth token authentication failed for room {room}', ['room' => $room->getLogLabel()]);

                return $this->handleError('invalid_token', 401, 'Invalid token', 'invalid_token');
            }

            // Room Auth Token was provided and is a UUID
            $roomAuthToken = RoomAuthToken::where('id', $providedRoomAuthToken)
                ->where('room_id', $room->id)
                ->where('session_id', session()->getId())
                ->first();

            if ($roomAuthToken == null) {
                // No room auth token matching the provided room auth token found (Invalid room auth token was provided)
                if ($providedRoomAuthTokenType === RoomAuthTokenType::TOKEN->value || $room->access_code != null) {
                    // Invalid room auth token provided and room requires an access code
                    // Metrics and logging
                    Counter::get('room_authentication_errors_total')->inc('room_auth_token_invalid');
                    Log::notice('Room auth token authentication failed for room {room}', ['room' => $room->getLogLabel()]);

                    return $this->handleError('invalid_token', 401, 'Invalid token', 'invalid_token');
                }
            } else {
                // Room auth token was found - check if provided type matches the found token type
                if ($roomAuthToken->type->value !== $providedRoomAuthTokenType) {
                    // Provided room auth token type does not match the type of the found room auth token
                    // Metrics and logging
                    Counter::get('room_authentication_errors_total')->inc('room_auth_token_invalid');
                    Log::notice('Room auth token authentication failed for room {room}', ['room' => $room->getLogLabel()]);

                    return $this->handleError('invalid_token', 401, 'Invalid token', 'invalid_token');
                }

                // ToDo Check if authenticated and token of type TOKEN was provided -> reject
            }
        }

        // Valid room auth token with type TOKEN was provided
        if (! Auth::user() && $roomAuthToken && $roomAuthToken->type === RoomAuthTokenType::TOKEN) {
            $authenticated = true;
            $token = $roomAuthToken->accessToken;
        }

        // user is not authenticated and room is not allowed for guests
        if (! $room->getRoomSetting('allow_guests') && ! $authenticated && ! Auth::user()) {
            Counter::get('room_authentication_errors_total')->inc('guest_access');

            Log::notice('Room guest access failed for room {room}', ['room' => $room->getLogLabel()]);

            return $this->handleError('guests_not_allowed', 403, 'Forbidden', 'guests_not_allowed');
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
            return $this->handleError('require_code', 403, 'Forbidden', 'require_code');
        }

        // make authentication status and token available to other parts of the application
        $this->roomAuthService->setAuthenticated($room, $authenticated);
        $this->roomAuthService->setRoomToken($room, $token);

        return $next($request);
    }

    private function handleError($type, $code, $title, $message)
    {
        if (request()->expectsJson()) {
            abort($code, $type);
        } else {
            return response(view('new-tab-error', [
                'type' => $type,
                'code' => $code,
                'title' => $title,
                'message' => $message,
            ]))->setStatusCode($code);
        }
    }
}
