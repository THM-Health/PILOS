<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\RoomUserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\AddRoomMember;
use App\Http\Requests\BulkDestroyRequest;
use App\Http\Requests\BulkImportRequest;
use App\Http\Requests\BulkUpdateRequest;
use App\Http\Requests\UpdateRoomMember;
use App\Http\Resources\RoomUser;
use App\Models\Room;
use App\Models\User;
use App\Settings\GeneralSettings;
use Auth;
use Illuminate\Http\Request;
use Log;

class RoomMemberController extends Controller
{
    public function __construct()
    {
        $this->middleware('room.authenticate', ['only' => ['join', 'leave']]);
    }

    /**
     * Return a list with all members of the room
     *
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index(Room $room, Request $request)
    {
        $additional = [];

        // Sort by column, fallback/default is firstname
        $sortBy = match ($request->query('sort_by')) {
            'lastname' => 'LOWER(lastname)',
            default => 'LOWER(firstname)',
        };

        // Sort direction, fallback/default is asc
        $sortOrder = match ($request->query('sort_direction')) {
            'desc' => 'DESC',
            default => 'ASC',
        };

        // Filter by role, fallback/default is no filter
        $filter = match ($request->query('filter')) {
            'participant_role' => ['role', RoomUserRole::USER],
            'moderator_role' => ['role', RoomUserRole::MODERATOR],
            'co_owner_role' => ['role', RoomUserRole::CO_OWNER],
            default => null,
        };

        // Get all members of the room and sort them
        $resource = $room->members()->orderByRaw($sortBy.' '.$sortOrder)->orderBy('users.id');

        // count all before applying filters
        $additional['meta']['total_no_filter'] = $resource->count();

        // Apply search query if set
        if ($request->has('search')) {
            // Split search query into single words and search for them in firstname and lastname
            $searchQueries = explode(' ', preg_replace('/\s\s+/', ' ', $request->search));
            foreach ($searchQueries as $searchQuery) {
                $resource = $resource->where(function ($query) use ($searchQuery) {
                    $query->whereLike('firstname', '%'.$searchQuery.'%')
                        ->orWhereLike('lastname', '%'.$searchQuery.'%');
                });
            }
        }

        // Apply filter if set, first element is the column, second the value to query
        if ($filter) {
            $resource = $resource->where($filter[0], $filter[1]);
        }

        return RoomUser::collection($resource->paginate(app(GeneralSettings::class)->pagination_page_size))->additional($additional);
    }

    /**
     * Add membership
     *
     * @return \Illuminate\Http\Response
     */
    public function store(Room $room, AddRoomMember $request)
    {
        $room->members()->attach($request->user, ['role' => $request->role]);

        $member = User::find($request->user);

        Log::info('Added member {member} with role {role} to room {room}', ['room' => $room->getLogLabel(), 'role' => RoomUserRole::from($request->role)->label(), 'member' => $member->getLogLabel()]);

        return response()->noContent();
    }

    /**
     * Add multiple members
     *
     * @return \Illuminate\Http\Response
     */
    public function bulkImport(Room $room, BulkImportRequest $request)
    {
        foreach ($request->user_emails as $userEmail) {
            $user = User::whereLike('email', $userEmail)->first();
            $room->members()->attach($user, ['role' => $request->role]);
        }

        Log::info('Added {count} member(s) with role {role} to room {room}', ['room' => $room->getLogLabel(), 'role' => RoomUserRole::from($request->role)->label(), 'count' => count($request->user_emails)]);

        return response()->noContent();
    }

    /**
     * Update membership role
     *
     * @return \Illuminate\Http\Response
     */
    public function update(Room $room, User $user, UpdateRoomMember $request)
    {
        if (! $room->members->contains($user)) {
            abort(410, __('app.errors.not_member_of_room'));
        }
        $room->members()->updateExistingPivot($user, ['role' => $request->role]);

        Log::info('Changed role for member {member} to {role} in room {room}', ['room' => $room->getLogLabel(), 'role' => RoomUserRole::from($request->role)->label(), 'member' => $user->getLogLabel()]);

        return response()->noContent();
    }

    /**
     * Update multiple member roles
     *
     * @return \Illuminate\Http\Response
     */
    public function bulkUpdate(Room $room, BulkUpdateRequest $request)
    {
        foreach ($request->users as $user) {
            $room->members()->updateExistingPivot($user, ['role' => $request->role]);
        }

        Log::info('Changed role for {count} member(s) to role {role} in room {room}', ['room' => $room->getLogLabel(), 'role' => RoomUserRole::from($request->role)->label(), 'count' => count($request->users)]);

        return response()->noContent();
    }

    /**
     * Remove membership
     *
     * @return \Illuminate\Http\Response
     */
    public function destroy(Room $room, User $user)
    {
        if (! $room->members->contains($user)) {
            abort(410, __('app.errors.not_member_of_room'));
        }
        $room->members()->detach($user);

        Log::info('Removed member {member} from room {room}', ['room' => $room->getLogLabel(), 'member' => $user->getLogLabel()]);

        return response()->noContent();
    }

    /**
     * Remove multiple members
     *
     * @return \Illuminate\Http\Response
     */
    public function bulkDestroy(Room $room, BulkDestroyRequest $request)
    {
        $room->members()->detach($request->users);

        Log::info('Removed {count} member(s) from room {room}', ['room' => $room->getLogLabel(), 'count' => count($request->users)]);

        return response()->noContent();
    }

    /**
     * User is self promoting to become a member
     *
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\Response
     */
    public function join(Room $room)
    {
        // Check if membership is enabled
        if (! $room->getRoomSetting('allow_membership')) {
            Log::notice('Failed to join room {room}; membership is disabled', ['room' => $room->getLogLabel()]);

            return response()->json(['message' => __('app.errors.membership_disabled')], 403);
        }
        // Only add to members, if user isn't already a member or the owner
        if (! $room->members->contains(Auth::user()) && ! $room->owner->is(Auth::user())) {
            $room->members()->attach(Auth::user()->id, ['role' => $room->getRoomSetting('default_role')]);
        }

        Log::info('Joined membership for room {room}', ['room' => $room->getLogLabel()]);

        return response()->noContent();
    }

    /**
     * Leaving membership in this room
     *
     * @return \Illuminate\Http\Response
     */
    public function leave(Room $room)
    {
        $room->members()->detach(Auth::user()->id);

        Log::info('Left membership for room {room}', ['room' => $room->getLogLabel()]);

        return response()->noContent();
    }
}
