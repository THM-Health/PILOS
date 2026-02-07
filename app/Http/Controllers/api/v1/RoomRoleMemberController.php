<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\RoomUserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\AddRoomRoleMember;
use App\Http\Requests\UpdateRoomRoleMember;
use App\Http\Resources\RoomRoleMember;
use App\Models\Role;
use App\Models\Room;
use App\Settings\GeneralSettings;
use Illuminate\Http\Request;
use Log;

class RoomRoleMemberController extends Controller
{
    /**
     * Return a list with all role-based members of the room
     *
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index(Room $room, Request $request)
    {
        $additional = [];

        // Sort by column, fallback/default is name
        $sortBy = match ($request->query('sort_by')) {
            default => 'LOWER(name)',
        };

        // Sort direction, fallback/default is asc
        $sortOrder = match ($request->query('sort_direction')) {
            'desc' => 'DESC',
            default => 'ASC',
        };

        // Filter by role, fallback/default is no filter
        $filter = match ($request->query('filter')) {
            'participant_role' => ['room_role.role', RoomUserRole::USER],
            'moderator_role' => ['room_role.role', RoomUserRole::MODERATOR],
            'co_owner_role' => ['room_role.role', RoomUserRole::CO_OWNER],
            default => null,
        };

        // Get all role members of the room and sort them
        $resource = $room->roleMembers()->withCount('users')->orderByRaw($sortBy.' '.$sortOrder)->orderBy('roles.id');

        // count all before applying filters
        $additional['meta']['total_no_filter'] = $resource->count();

        // Apply search query if set
        if ($request->has('query')) {
            $resource = $resource->where(function ($query) use ($request) {
                $query->whereLike('name', '%'.$request->query('query').'%');
            });
        }

        // Apply filter if set
        if ($filter) {
            $resource = $resource->wherePivot($filter[0], $filter[1]);
        }

        return RoomRoleMember::collection($resource->paginate(app(GeneralSettings::class)->pagination_page_size))->additional($additional);
    }

    /**
     * Add a role as a room member
     *
     * @return \Illuminate\Http\Response
     */
    public function store(Room $room, AddRoomRoleMember $request)
    {
        $room->roleMembers()->attach($request->role_id, ['role' => $request->role]);

        $role = Role::find($request->role_id);

        Log::info('Added role {role} with room role {roomRole} to room {room}', ['room' => $room->getLogLabel(), 'roomRole' => RoomUserRole::from($request->role)->label(), 'role' => $role->getLogLabel()]);

        return response()->noContent();
    }

    /**
     * Update a role's room membership role
     *
     * @return \Illuminate\Http\Response
     */
    public function update(Room $room, Role $role, UpdateRoomRoleMember $request)
    {
        if (! $room->roleMembers()->where('role_id', $role->id)->exists()) {
            abort(410, __('app.errors.role_not_member_of_room'));
        }
        $room->roleMembers()->updateExistingPivot($role, ['role' => $request->role]);

        Log::info('Changed room role for role {role} to {roomRole} in room {room}', ['room' => $room->getLogLabel(), 'roomRole' => RoomUserRole::from($request->role)->label(), 'role' => $role->getLogLabel()]);

        return response()->noContent();
    }

    /**
     * Remove a role from room membership
     *
     * @return \Illuminate\Http\Response
     */
    public function destroy(Room $room, Role $role)
    {
        if (! $room->roleMembers()->where('role_id', $role->id)->exists()) {
            abort(410, __('app.errors.role_not_member_of_room'));
        }
        $room->roleMembers()->detach($role);

        Log::info('Removed role {role} from room {room}', ['room' => $room->getLogLabel(), 'role' => $role->getLogLabel()]);

        return response()->noContent();
    }
}
