<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\CustomErrorMessages;
use App\Enums\CustomStatusCodes;
use App\Enums\RoomAuthTokenType;
use App\Models\Room;
use App\Models\RoomAuthToken;
use App\Prometheus\Counter;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class RoomAuthenticate
{
    /**
     * Handle requests to room routes and determine room unauthenticated status
     *
     * This middleware checks if a user is owner, member, has a valid room auth token or non is required
     * If any of these rules fail, the user isn't authenticated and the middleware param allowAuthenticated
     * decides what to do
     *
     * If a room auth token is provided, but is invalid an error is return and the request isn't continued.
     *
     * @param  Request  $request
     * @param  bool  $allowUnAuthenticated  Allow users that are unauthenticated to pass
     * @return mixed
     */
    public function handle($request, Closure $next, $allowUnAuthenticated = false)
    {
        $authenticated = false;
        $room = $request->route('room');
        $personalizedLink = null;
        $roomAuthToken = null;

        // requested user is the owner or a member of the room
        if (Auth::user() && ($room->owner->is(Auth::user()) || $room->members->contains(Auth::user()) || Auth::user()->can('viewAll', Room::class))) {
            $authenticated = true;
        }

        // Retrieve room auth token if provided
        if ($request->has('room_auth_token')) {
            // Validate room auth token input
            $validator = Validator::make($request->all(), [
                'room_auth_token' => ['required', 'uuid'],
                'room_auth_token_type' => ['required', Rule::enum(RoomAuthTokenType::class)],
            ]);

            if ($validator->stopOnFirstFailure()->fails()) {
                Counter::get('room_authentication_errors_total')->inc('room_auth_token_invalid');
                Log::notice('Room auth token authentication failed for room {room} (Input validation failed)', ['room' => $room->getLogLabel()]);

                return $this->handleError(CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value, 401, 'Invalid token', __('rooms.flash.auth_token_invalid'));
            }

            // Retrieve the validated input
            $validated = $validator->validated();
            $providedRoomAuthToken = $validated['room_auth_token'];
            $providedRoomAuthTokenType = RoomAuthTokenType::from((int) $validated['room_auth_token_type']);

            // Room Auth Token was provided and is a UUID
            $roomAuthToken = RoomAuthToken::where('id', $providedRoomAuthToken)
                ->where('room_id', $room->id)
                ->where('session_id', session()->getId())
                ->first();

            if ($roomAuthToken == null) {
                // No room auth token matching the provided room auth token found
                // (Invalid room auth token was provided)
                if ($providedRoomAuthTokenType === RoomAuthTokenType::PERSONALIZED_LINK || $room->access_code != null) {
                    // Provided invalid room auth token was of type PERSONALIZED_LINK or room has an access code set

                    // Metrics and logging
                    Counter::get('room_authentication_errors_total')->inc('room_auth_token_invalid');
                    Log::notice('Room auth token authentication failed for room {room} (Room auth token was invalid)', ['room' => $room->getLogLabel()]);

                    return $this->handleError(
                        CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value,
                        401,
                        'Invalid token',
                        $providedRoomAuthTokenType == RoomAuthTokenType::PERSONALIZED_LINK
                            ? __('rooms.flash.personalized_link_invalid')
                            : __('rooms.flash.access_code_invalid')
                    );
                }
            } else {
                // Room auth token was found - check if provided type matches the found token type
                if ($roomAuthToken->type !== $providedRoomAuthTokenType) {
                    // Provided room auth token type does not match the type of the found room auth token
                    // Metrics and logging
                    Counter::get('room_authentication_errors_total')->inc('room_auth_token_invalid');
                    Log::notice('Room auth token authentication failed for room {room} (Room auth token types do not match)', ['room' => $room->getLogLabel()]);

                    return $this->handleError(CustomErrorMessages::ROOM_INVALID_AUTH_TOKEN->value, 401, 'Invalid token', __('rooms.flash.auth_token_invalid'));
                }

                if (! Auth::guest() && $roomAuthToken->type === RoomAuthTokenType::PERSONALIZED_LINK) {
                    // Authenticated user provided a room auth token of type TOKEN
                    Counter::get('room_authentication_errors_total')->inc('room_auth_token_invalid');
                    Log::notice('Room auth token authentication failed for room {room} (Authenticated with token type token)', ['room' => $room->getLogLabel()]);

                    return $this->handleError(CustomErrorMessages::GUESTS_ONLY->value, CustomStatusCodes::GUESTS_ONLY->value, 'Guests only', __('app.flash.guests_only'));
                }
            }
        }

        // Valid room auth token with type PERSONALIZED_LINK was provided
        if (! Auth::user() && $roomAuthToken && $roomAuthToken->type === RoomAuthTokenType::PERSONALIZED_LINK) {
            $authenticated = true;
            $personalizedLink = $roomAuthToken->personalizedLink;
        }

        // user is not authenticated and room is not allowed for guests
        if (! $room->getRoomSetting('allow_guests') && ! $authenticated && ! Auth::user()) {
            Counter::get('room_authentication_errors_total')->inc('guest_access');

            Log::notice('Room guest access failed for room {room}', ['room' => $room->getLogLabel()]);

            return $this->handleError(CustomErrorMessages::GUESTS_NOT_ALLOWED->value, 403, 'Forbidden', __('rooms.only_used_by_authenticated_users'));
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
            return $this->handleError(CustomErrorMessages::ROOM_REQUIRE_CODE->value, 403, 'Forbidden', __('rooms.require_access_code'));
        }

        // make authentication status and personalized link available to other parts of the application
        Context::addHidden("room.{$room->id}.authenticated", $authenticated);
        Context::addHidden("room.{$room->id}.personalized_link", $personalizedLink);

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
