<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\CustomStatusCodes;
use App\Enums\RoomSortingType;
use App\Enums\RoomUserRole;
use App\Enums\RoomVisibility;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateRoom;
use App\Http\Requests\JoinMeeting;
use App\Http\Requests\ShowRoomsRequest;
use App\Http\Requests\StartMeeting;
use App\Http\Requests\TransferOwnershipRequest;
use App\Http\Requests\UpdateRoomDescription;
use App\Http\Requests\UpdateRoomSettings;
use App\Http\Resources\RoomSettings;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Services\RoomAuthService;
use App\Services\RoomService;
use App\Settings\GeneralSettings;
use Auth;
use DB;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Log;

class RoomController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Room::class, 'room');
    }

    /**
     * Return a json array with all rooms the user owners or is member of
     *
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection|\Illuminate\Http\Response
     */
    public function index(ShowRoomsRequest $request)
    {
        $additionalMeta = [];

        if ($request->only_favorites) {
            // list if room favorites
            $roomFavorites = Auth::user()->roomFavorites->modelKeys();
            $collection = Room::whereIn('rooms.id', $roomFavorites);
        } else {
            // all rooms without limitation (always include own rooms, shared rooms and public rooms)
            if ($request->filter_all && Auth::user()->can('viewAll', Room::class)) {
                $collection = Room::query();
            } else {
                $collection = Room::where(function (Builder $query) use ($request) {
                    // own rooms
                    if ($request->filter_own) {
                        $query->orWhere('user_id', '=', Auth::user()->id);
                    }

                    // rooms where the user is member
                    if ($request->filter_shared) {
                        // list of room ids where the user is member
                        $roomMemberships = Auth::user()->sharedRooms->modelKeys();
                        $query->orWhereIn('rooms.id', $roomMemberships);
                    }

                    // all rooms that are public
                    if ($request->filter_public) {
                        $query->orWhere(function (Builder $subQuery) {
                            $roomTypesWithListingEnforced = RoomType::where('visibility_enforced', true)->where('visibility_default', RoomVisibility::PUBLIC)->get('id');
                            $roomTypesWithNoListingEnforced = RoomType::where('visibility_enforced', true)->where('visibility_default', RoomVisibility::PRIVATE)->get('id');
                            $roomTypesWithListingDefault = RoomType::where('visibility_enforced', false)->where('visibility_default', RoomVisibility::PUBLIC)->get('id');
                            $subQuery
                                // Room has a room type where the visibility public is enforced
                                ->whereIn('room_type_id', $roomTypesWithListingEnforced)
                                // Room where expert mode is deactivated where the visibility public is the default value
                                ->orWhere(function (Builder $subSubQuery) use ($roomTypesWithListingDefault) {
                                    $subSubQuery
                                        ->where('expert_mode', false)
                                        ->whereIn('room_type_id', $roomTypesWithListingDefault);
                                })
                                // Room where expert mode is activated and visibility is set to public
                                ->orWhere(function (Builder $subSubQuery) use ($roomTypesWithNoListingEnforced) {
                                    $subSubQuery
                                        ->where('expert_mode', true)
                                        ->where('visibility', RoomVisibility::PUBLIC)
                                        ->whereNotIn('room_type_id', $roomTypesWithNoListingEnforced);
                                });
                        });
                    }

                    // prevent request with no filter (would return all rooms)
                    if (! $request->filter_own && ! $request->filter_shared && ! $request->filter_public) {
                        abort(400);
                    }
                });
            }
        }

        // join relationship table to allow sorting by relationship columns
        $collection->leftJoin('meetings', 'rooms.meeting_id', '=', 'meetings.id');
        $collection->join('room_types', 'rooms.room_type_id', '=', 'room_types.id');
        $collection->join('users', 'rooms.user_id', '=', 'users.id');

        // only select columns from rooms table to prevent duplicate column names
        $collection->select('rooms.*');

        // eager load relationships
        $collection->with(['owner', 'roomType', 'latestMeeting']);

        // count all available rooms before search
        $additionalMeta['meta']['total_no_filter'] = $collection->count();

        // filter by specific room Type if not only favorites
        if ($request->has('room_type') && ! $request->only_favorites) {
            $collection->where('room_type_id', $request->room_type);
        }

        // rooms that can be found with the search
        if ($request->has('search') && trim($request->search) != '') {
            $searchQueries = explode(' ', preg_replace('/\s\s+/', ' ', $request->search));
            foreach ($searchQueries as $searchQuery) {
                $collection = $collection->where(function ($query) use ($searchQuery) {
                    $query->whereLike('rooms.name', '%'.$searchQuery.'%')
                        ->orWhereHas('owner', function ($query2) use ($searchQuery) {
                            $query2->whereLike('users.firstname', '%'.$searchQuery.'%')
                                ->orWhereLike('users.lastname', '%'.$searchQuery.'%');
                        });
                });
            }
        }
        // sort rooms by different strategies
        $collection = match ($request->sort_by) {
            RoomSortingType::ALPHA->value => $collection->orderByRaw('LOWER(rooms.name)'),
            RoomSortingType::ROOM_TYPE->value => $collection->orderByRaw('LOWER(room_types.name)')->orderByRaw('LOWER(rooms.name)'),
            default => $collection->orderByRaw('meetings.start IS NULL ASC')->orderByRaw('meetings.end IS NULL DESC')->orderByDesc('meetings.start')->orderByRaw('LOWER(rooms.name)'),
        };

        // count own rooms
        $additionalMeta['meta']['total_own'] = Auth::user()->myRooms()->count();

        $collection = $collection->paginate($request->per_page);

        return \App\Http\Resources\Room::collection($collection)->additional($additionalMeta);
    }

    /**
     * Store a new created room
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \App\Http\Resources\Room|JsonResponse
     */
    public function store(CreateRoom $request)
    {
        if (Auth::user()->hasRoomLimitExceeded()) {
            abort(CustomStatusCodes::ROOM_LIMIT_EXCEEDED->value, __('app.errors.room_limit_exceeded'));
        }

        $room = new Room;
        $room->name = $request->name;
        $room->roomType()->associate($request->room_type);
        $room->owner()->associate(Auth::user());

        $room->save();

        // Create access code if activated for this room type
        if ($room->roomType->has_access_code_default) {
            $room->access_code = random_int(111111111, 999999999);
        }

        // Apply non-expert settings of the room type
        foreach (Room::ROOM_SETTINGS_DEFINITION as $setting => $config) {
            if (! $config['expert']) {
                $room[$setting] = $room->roomType[$setting.'_default'];
            }
        }

        $room->save();

        Log::info('Created new room {room}', ['room' => $room->getLogLabel()]);

        return new \App\Http\Resources\Room($room);
    }

    /**
     * Return all general room details
     *
     * @return \App\Http\Resources\Room
     */
    public function show(Room $room, RoomAuthService $roomAuthService)
    {
        return (new \App\Http\Resources\Room($room))->withDetails();
    }

    /**
     * Return all room settings
     *
     * @return RoomSettings
     */
    public function getSettings(Room $room)
    {
        $this->authorize('viewSettings', $room);

        return new RoomSettings($room);
    }

    /**
     * Start a new meeting
     *
     * @return JsonResponse
     *
     * @throws AuthorizationException
     */
    public function start(Room $room, StartMeeting $request)
    {
        $roomService = new RoomService($room);
        $url = $roomService->start($request->consent_record_attendance, $request->consent_record)->getJoinUrl($request);

        return response()->json(['url' => $url]);
    }

    /**
     * Join a running meeting
     *
     * @return JsonResponse
     */
    public function join(Room $room, JoinMeeting $request)
    {
        $roomService = new RoomService($room);
        $url = $roomService->join($request->consent_record_attendance, $request->consent_record)->getJoinUrl($request);

        return response()->json(['url' => $url]);
    }

    /**
     * Update room settings
     *
     * @return RoomSettings
     */
    public function update(UpdateRoomSettings $request, Room $room)
    {
        $room->name = $request->name;
        $room->expert_mode = $request->expert_mode;
        $room->short_description = $request->short_description;
        $room->access_code = $request->access_code;

        foreach (Room::ROOM_SETTINGS_DEFINITION as $setting => $config) {
            // Expert mode for room is deactivated and setting is an expert setting: do not update setting
            if (! $room->expert_mode && $config['expert']) {
                continue;
            }

            $room[$setting] = $request[$setting];
        }

        // Save welcome message if expert mode enabled, otherwise clear
        $room->welcome = $room->expert_mode ? $request->welcome : null;

        $room->roomType()->associate($request->room_type);

        $room->save();

        Log::info('Changed settings for room {room}', ['room' => $room->getLogLabel()]);

        return new RoomSettings($room);
    }

    /**
     * Update room description
     *
     * @return \Illuminate\Http\Response
     */
    public function updateDescription(UpdateRoomDescription $request, Room $room)
    {
        $room->description = $request->description;

        // Remove empty paragraph (tiptop editor always outputs at least one empty paragraph)
        if ($room->description == '<p></p>') {
            $room->description = null;
        }

        $room->save();
        $room->refresh();

        Log::info('Changed description for room {room}', ['room' => $room->getLogLabel()]);

        return response()->noContent();
    }

    /**
     * Delete a room and all related data
     *
     * @return \Illuminate\Http\Response
     */
    public function destroy(Room $room)
    {
        $room->delete();

        Log::info('Deleted room {room}', ['room' => $room->getLogLabel()]);

        return response()->noContent();
    }

    /**
     * List of all meeting of the given room
     *
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     *
     * @throws AuthorizationException
     */
    public function meetings(Room $room, Request $request)
    {
        $this->authorize('viewStatistics', $room);

        // Sort by column, fallback/default is start time
        $sortBy = match ($request->query('sort_by')) {
            default => 'start',
        };

        // Sort direction, fallback/default is asc
        $sortOrder = match ($request->query('sort_direction')) {
            'desc' => 'DESC',
            default => 'ASC',
        };

        // Get all meeting of the room and sort them, only meetings that are not in the starting phase
        $resource = $room->meetings()->orderByRaw($sortBy.' '.$sortOrder)->whereNotNull('start');

        return \App\Http\Resources\Meeting::collection($resource->paginate(app(GeneralSettings::class)->pagination_page_size));
    }

    /**
     * add a room to the users favorites
     *
     * @return \Illuminate\Http\Response
     */
    public function addToFavorites(Room $room)
    {
        Auth::user()->roomFavorites()->syncWithoutDetaching([$room->id]);

        return response()->noContent();
    }

    /**
     * delete a room from the users favorites
     *
     * @return \Illuminate\Http\Response
     */
    public function deleteFromFavorites(Room $room)
    {
        Auth::user()->roomFavorites()->detach($room);

        return response()->noContent();
    }

    /**
     * transfer the room ownership to another user
     *
     * @return \Illuminate\Http\Response
     */
    public function transferOwnership(Room $room, TransferOwnershipRequest $request)
    {
        $oldOwner = $room->owner;
        $newOwner = User::findOrFail($request->user);

        DB::beginTransaction();

        try {
            // delete the new owner from the members if he is a member of the room
            if ($room->members->contains($newOwner)) {
                $room->members()->detach($newOwner);
            }

            $room->owner()->associate($newOwner);
            $room->save();

            // add old owner to the members
            if ($request->role) {
                $room->members()->attach($oldOwner, ['role' => $request->role]);
            }

            DB::commit();
            Log::info('Transferred room ownership of the room {room} from previous owner {oldOwner} to new owner {newOwner}', ['room' => $room->getLogLabel(), 'oldOwner' => $oldOwner->getLogLabel(), 'newOwner' => $newOwner->getLogLabel()]);
            if ($request->role) {
                Log::info('Changed role of previous owner {oldOwner} of the room {room} to the role {role}', ['oldOwner' => $oldOwner->getLogLabel(), 'room' => $room->getLogLabel(), 'role' => RoomUserRole::from($request->role)->label()]);
            }

            return response()->noContent();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to transfer ownership of the room {room} from previous owner {oldOwner} to new owner {newOwner}', ['room' => $room->getLogLabel(), 'oldOwner' => $oldOwner->getLogLabel(), 'newOwner' => $newOwner->getLogLabel()]);

            return abort(500);
        }
    }
}
