<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddRoomMember;
use App\Http\Requests\UpdateRoomMember;
use App\Http\Resources\RoomUser;
use App\Room;
use App\User;
use Auth;

class RoomMemberController extends Controller
{
    public function __construct()
    {
        $this->middleware('room.authenticate', ['only' => ['join']]);
    }

    /**
     * Return a list with all members of the room
     *
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index(Room $room)
    {
        return RoomUser::collection($room->members);
    }

    /**
     * Add membership
     *
     * @param  AddRoomMember             $request
     * @param  Room                      $room
     * @return \Illuminate\Http\Response
     */
    public function store(Room $room, AddRoomMember $request)
    {
        $room->members()->attach($request->user, ['role' => $request->role]);
    }

    /**
     * Update membership role
     *
     * @param  UpdateRoomMember          $request
     * @param  Room                      $room
     * @param  User                      $user
     * @return \Illuminate\Http\Response
     */
    public function update(Room $room, User $user, UpdateRoomMember $request)
    {
        if (!$room->members->contains($user)) {
            abort(404, 'not_member_of_room');
        }
        $room->members()->updateExistingPivot($user, ['role' => $request->role]);

        return response()->noContent();
    }

    /**
     * Remove membership
     *
     * @param  Room                      $room
     * @param  User                      $user
     * @return \Illuminate\Http\Response
     */
    public function destroy(Room $room, User $user)
    {
        if (!$room->members->contains($user)) {
            abort(404, 'not_member_of_room');
        }
        $room->members()->detach($user);

        return response()->noContent();
    }

    /**
     * User is self promoting to become a member
     * @param  Room                      $room
     * @return \Illuminate\Http\Response
     */
    public function join(Room $room)
    {
        // Check if membership is enabled
        if (!$room->allowMembership) {
            abort(403);
        }
        // Only add to members, if user isn't already a member
        if (!$room->members->contains(Auth::user())) {
            $room->members()->attach(Auth::user()->id, ['role' => $room->defaultRole]);
        }

        return response()->noContent();
    }

    /**
     * Leaving membership in this room
     * @param  Room                      $room
     * @return \Illuminate\Http\Response
     */
    public function leave(Room $room)
    {
        $room->members()->detach(Auth::user()->id);

        return response()->noContent();
    }
}
