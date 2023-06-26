<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\RoomUserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\AddRoomMember;
use App\Http\Requests\BulkImportRequest;
use App\Http\Requests\BulkUpdateRequest;
use App\Http\Requests\BulkDestroyRequest;
use App\Http\Requests\UpdateRoomMember;
use App\Http\Resources\RoomUser;
use App\Models\Room;
use App\Models\User;
use Auth;
use Log;

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

        $member = User::find($request->user);

        Log::info('Added member {member} with role {role} to room {room}', ['room' => $room->getLogLabel(), 'role' => RoomUserRole::getDescription($request->role), 'member' => $member->getLogLabel() ]);

        return response()->noContent();
    }

    /**
     * Add multiple members
     *
     * @param  Room                      $room
     * @param  BulkImportRequest         $request
     * @return \Illuminate\Http\Response
     */
    public function bulkImport(Room $room, BulkImportRequest $request)
    {
        foreach ($request->user_emails as $userEmail) {
            $user = User::firstWhere('email', $userEmail);
            $room->members()->attach($user, ['role' => $request->role]);
        }

        Log::info('Added {count} member(s) with role {role} to room {room}', ['room' => $room->getLogLabel(), 'role' => RoomUserRole::getDescription($request->role), 'count' => count($request->user_emails) ]);

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

        Log::info('Changed role for member {member} to {role} in room {room}', ['room' => $room->getLogLabel(), 'role' => RoomUserRole::getDescription($request->role), 'member' => $user->getLogLabel() ]);

        return response()->noContent();
    }

    /**
     * Update multiple member roles
     *
     * @param  BulkUpdateRequest         $request
     * @param  Room                      $room
     * @return \Illuminate\Http\Response
     */
    public function bulkUpdate(Room $room, BulkUpdateRequest $request)
    {
        foreach ($request->users as $user) {
            $room->members()->updateExistingPivot($user, ['role' => $request->role]);
        }

        Log::info('Changed role for {count} member(s) to role {role} in room {room}', ['room' => $room->getLogLabel(), 'role' => RoomUserRole::getDescription($request->role), 'count' => count($request->users) ]);

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

        Log::info('Removed member {member} from room {room}', ['room' => $room->getLogLabel(), 'member' => $user->getLogLabel() ]);

        return response()->noContent();
    }

    /**
     * Remove multiple members
     *
     * @param  Room                      $room
     * @param  BulkDestroyRequest        $request
     * @return \Illuminate\Http\Response
     */
    public function bulkDestroy(Room $room, BulkDestroyRequest $request)
    {
        $room->members()->detach($request->users);

        Log::info('Removed {count} member(s) from room {room}', ['room' => $room->getLogLabel(), 'count' => count($request->users) ]);

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
            Log::notice('Failed to join room {room}; membership is disabled', ['room' => $room->getLogLabel()]);

            return response()->json(['message'=>__('app.errors.membership_disabled')], 403);
        }
        // Only add to members, if user isn't already a member or the owner
        if (!$room->members->contains(Auth::user()) && !$room->owner->is(Auth::user())) {
            $room->members()->attach(Auth::user()->id, ['role' => $room->default_role]);
        }

        Log::info('Joined membership for room {room}', ['room' => $room->getLogLabel()]);

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

        Log::info('Left membership for room {room}', ['room' => $room->getLogLabel()]);

        return response()->noContent();
    }
}
