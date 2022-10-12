<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddRoomMember;
use App\Http\Requests\MassUpdateRequest;
use App\Http\Requests\MassDeleteRequest;
use App\Http\Requests\UpdateRoomMember;
use App\Http\Resources\RoomUser;
use App\Models\Room;
use App\Models\User;
use Auth;

class RoomMemberController extends Controller
{
    public function __construct()
    {
        $this->middleware('room.authenticate', ['only' => ['join','leave']]);
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

        return response()->noContent();
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
            abort(410, __('app.errors.not_member_of_room'));
        }
        $room->members()->updateExistingPivot($user, ['role' => $request->role]);

        return response()->noContent();
    }

    /**
     * Update multiple member roles
     *
     * @param  MassUpdateRequest         $request
     * @param  Room                      $room
     * @return \Illuminate\Http\Response
     */
    public function bulkUpdate(Room $room, MassUpdateRequest $request)
    {
        foreach ($request->users as $user) {
            $room->members()->updateExistingPivot($user, ['role' => $request->role]); //
        }

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
            abort(410, __('app.errors.not_member_of_room'));
        }
        $room->members()->detach($user);

        return response()->noContent();
    }

    /**
     * Remove multiple members
     *
     * @param  Room                      $room
     * @param  MassDeleteRequest         $request
     * @return \Illuminate\Http\Response
     */
    public function bulkDestroy(Room $room, MassDeleteRequest $request)
    {
        $room->members()->detach($request->users);

        return response()->noContent();
    }

    /**
     * User is self promoting to become a member
     * @param  Room                                                    $room
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\Response
     */
    public function join(Room $room)
    {
        // Check if membership is enabled
        if (!$room->allow_membership) {
            return response()->json(['message'=>__('app.errors.membership_disabled')], 403);
        }
        // Only add to members, if user isn't already a member or the owner
        if (!$room->members->contains(Auth::user()) && !$room->owner->is(Auth::user())) {
            $room->members()->attach(Auth::user()->id, ['role' => $room->default_role]);
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
