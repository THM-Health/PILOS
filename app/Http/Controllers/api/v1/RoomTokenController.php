<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoomTokenRequest;
use App\Http\Resources\RoomToken;
use App\Room;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class RoomTokenController extends Controller
{
    /**
     * Return a list with all personalized tokens of the room
     *
     * @return AnonymousResourceCollection
     */
    public function index(Room $room)
    {
        return RoomToken::collection($room->tokens);
    }

    /**
     * Add membership
     *
     * @param  Room             $room
     * @param  RoomTokenRequest $request
     * @return Response
     */
    public function store(Room $room, RoomTokenRequest $request)
    {
        // TODO

        return response()->noContent();
    }

    /**
     * Update membership role
     *
     * @param  Room             $room
     * @param  RoomTokenRequest $request
     * @param  \App\RoomToken   $token
     * @return Response
     */
    public function update(Room $room, \App\RoomToken $token, RoomTokenRequest $request)
    {
        // TODO

        return response()->noContent();
    }

    /**
     * Remove membership
     *
     * @param  Room           $room
     * @param  \App\RoomToken $token
     * @return Response
     */
    public function destroy(Room $room, \App\RoomToken $token)
    {
        // TODO

        return response()->noContent();
    }
}
