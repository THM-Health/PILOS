<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoomTokenRequest;
use App\Http\Resources\RoomToken as RoomTokenResource;
use App\Room;
use App\RoomToken;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class RoomTokenController extends Controller
{
    /**
     * Return a list with all personalized tokens of the room.
     *
     * @param Room $room Room for which the tokens should be listed.
     * @return AnonymousResourceCollection
     */
    public function index(Room $room)
    {
        return RoomTokenResource::collection($room->tokens);
    }

    /**
     * Add a new personalized room token.
     *
     * @param  Room              $room
     * @param  RoomTokenRequest  $request
     * @return RoomTokenResource
     */
    public function store(Room $room, RoomTokenRequest $request)
    {
        $token            = new RoomToken();
        $token->firstname = $request->firstname;
        $token->lastname  = $request->lastname;
        $token->role      = $request->role;
        $room->tokens()->save($token);

        return new RoomTokenResource($token);
    }

    /**
     * Update personalized room token.
     *
     * @param  Room              $room
     * @param  RoomTokenRequest  $request
     * @param  RoomToken         $token
     * @return RoomTokenResource
     */
    public function update(Room $room, RoomToken $token, RoomTokenRequest $request)
    {
        if (!$token->room->is($room)) {
            abort(404, __('app.errors.token_not_found'));
        }

        $token->firstname = $request->firstname;
        $token->lastname  = $request->lastname;
        $token->role      = $request->role;
        $token->save();

        return new RoomTokenResource($token);
    }

    /**
     * Remove personalized room token.
     *
     * @param Room $room
     * @param RoomToken $token
     * @return Response
     * @throws \Exception
     */
    public function destroy(Room $room, RoomToken $token)
    {
        if (!$token->room->is($room)) {
            abort(404, __('app.errors.token_not_found'));
        }

        $token->delete();

        return response()->noContent();
    }
}
