<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\CustomStatusCodes;
use App\Enums\RoomSortingType;
use App\Enums\RoomUserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateRoom;
use App\Http\Requests\ShowRoomsRequest;
use App\Http\Requests\StartJoinMeeting;
use App\Http\Requests\TransferOwnershipRequest;
use App\Http\Requests\UpdateRoomDescription;
use App\Http\Requests\UpdateRoomSettings;
use App\Http\Resources\RoomSettings;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Services\RoomAuthService;
use App\Services\RoomService;
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
            //list if room favorites
            $roomFavorites = Auth::user()->roomFavorites->modelKeys();
            $collection    = Room::whereIn('rooms.id', $roomFavorites);
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
                        $roomMemberships             = Auth::user()->sharedRooms->modelKeys();
                        $query->orWhereIn('rooms.id', $roomMemberships);
                    }

                    // all rooms that are public (listed and without access code)
                    if ($request->filter_public) {
                        $query->orWhere(function (Builder $subQuery) {
                            // list of room types for which listing is enabled
                            $roomTypesWithListingEnabled = RoomType::where('allow_listing', 1)->get('id');
                            $subQuery->where('listed', 1)
                                ->whereNull('access_code')
                                ->whereIn('room_type_id', $roomTypesWithListingEnabled);
                        });
                    }

                    // prevent request with no filter (would return all rooms)
                    if (!$request->filter_own && !$request->filter_shared && !$request->filter_public) {
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
        $collection->with(['owner','roomType','latestMeeting']);

        // count all available rooms before search
        $additionalMeta['meta']['total_no_filter'] = $collection->count();

        // filter by specific room Type if not only favorites
        if ($request->has('room_type') && !$request->only_favorites) {
            $collection->where('room_type_id', $request->room_type);
        }

        // rooms that can be found with the search
        if ($request->has('search') && trim($request->search) != '') {
            $searchQueries  =  explode(' ', preg_replace('/\s\s+/', ' ', $request->search));
            foreach ($searchQueries as $searchQuery) {
                $collection = $collection->where(function ($query) use ($searchQuery) {
                    $query->where('rooms.name', 'like', '%' . $searchQuery . '%')
                        ->orWhereHas('owner', function ($query2) use ($searchQuery) {
                            $query2->where('users.firstname', 'like', '%' . $searchQuery . '%')
                                ->orWhere('users.lastname', 'like', '%' . $searchQuery . '%');
                        });
                });
            }
        }
        // sort rooms by different strategies
        $collection = match ($request->sort_by) {
            RoomSortingType::ALPHA->value     => $collection->orderBy('rooms.name'),
            RoomSortingType::ROOM_TYPE->value => $collection->orderBy('room_types.name')->orderBy('rooms.name'),
            default                           => $collection->orderByRaw('meetings.start IS NULL ASC')->orderByRaw('meetings.end IS NULL DESC')->orderByDesc('meetings.start')->orderBy('rooms.name'),
        };

        // count own rooms
        $additionalMeta['meta']['total_own'] = Auth::user()->myRooms()->count();

        $collection = $collection->paginate(setting('room_pagination_page_size'));

        return \App\Http\Resources\Room::collection($collection)->additional($additionalMeta);
    }

    /**
     * Store a new created room
     *
     * @param  \Illuminate\Http\Request              $request
     * @return \App\Http\Resources\Room|JsonResponse
     */
    public function store(CreateRoom $request)
    {
        if (Auth::user()->hasRoomLimitExceeded()) {
            abort(CustomStatusCodes::ROOM_LIMIT_EXCEEDED->value, __('app.errors.room_limit_exceeded'));
        }

        $room              = new Room();
        $room->name        = $request->name;
        $room->access_code = rand(111111111, 999999999);
        $room->roomType()->associate($request->room_type);
        $room->owner()->associate(Auth::user());
        $room->save();

        Log::info('Created new room {room}', ['room' => $room->getLogLabel()]);

        return new \App\Http\Resources\Room($room);
    }

    /**
     * Return all general room details
     *
     * @param  Room                     $room
     * @return \App\Http\Resources\Room
     */
    public function show(Room $room, RoomAuthService $roomAuthService)
    {
        return (new \App\Http\Resources\Room($room))->withDetails();
    }

    /**
     * Return all room settings
     * @param  Room         $room
     * @return RoomSettings
     */
    public function getSettings(Room $room)
    {
        $this->authorize('viewSettings', $room);

        return new RoomSettings($room);
    }

    /**
     * Start a new meeting
     * @param  Room                   $room
     * @param  StartJoinMeeting       $request
     * @return JsonResponse
     * @throws AuthorizationException
     */
    public function start(Room $room, StartJoinMeeting $request, RoomAuthService $roomAuthService)
    {
        $this->authorize('start', [$room, $roomAuthService->getRoomToken($room)]);

        $roomService = new RoomService($room);
        $url         = $roomService->start($request->record_attendance)->getJoinUrl($request);

        return response()->json(['url' => $url]);
    }

    /**
     * Join a running meeting
     * @param  Room             $room
     * @param  StartJoinMeeting $request
     * @return JsonResponse
     */
    public function join(Room $room, StartJoinMeeting $request)
    {
        $roomService = new RoomService($room);
        $url         = $roomService->join($request->record_attendance)->getJoinUrl($request);

        return response()->json(['url' => $url]);
    }

    /**
     * Update room settings
     * @param  UpdateRoomSettings $request
     * @param  Room               $room
     * @return RoomSettings
     */
    public function update(UpdateRoomSettings $request, Room $room)
    {
        $room->name             = $request->name;
        $room->welcome          = $request->welcome;
        $room->short_description= $request->short_description;
        $room->access_code      = $request->access_code;
        $room->listed           = $request->listed;

        $room->mute_on_start                      = $request->mute_on_start;
        $room->lock_settings_disable_cam          = $request->lock_settings_disable_cam;
        $room->webcams_only_for_moderator         = $request->webcams_only_for_moderator;
        $room->lock_settings_disable_mic          = $request->lock_settings_disable_mic;
        $room->lock_settings_disable_private_chat = $request->lock_settings_disable_private_chat;
        $room->lock_settings_disable_public_chat  = $request->lock_settings_disable_public_chat;
        $room->lock_settings_disable_note         = $request->lock_settings_disable_note;
        $room->lock_settings_lock_on_join         = $request->lock_settings_lock_on_join;
        $room->lock_settings_hide_user_list       = $request->lock_settings_hide_user_list;
        $room->everyone_can_start                 = $request->everyone_can_start;
        $room->allow_membership                   = $request->allow_membership;
        $room->allow_guests                       = $request->allow_guests;

        $room->record_attendance              = $request->record_attendance;

        $room->default_role = $request->default_role;
        $room->lobby        = $request->lobby;
        $room->roomType()->associate($request->room_type);

        $room->save();

        Log::info('Changed settings for room {room}', ['room' => $room->getLogLabel() ]);

        return new RoomSettings($room);
    }

    /**
     * Update room description
     * @param  UpdateRoomDescription $request
     * @param  Room                  $room
     * @return RoomSettings
     */
    public function updateDescription(UpdateRoomDescription $request, Room $room)
    {
        $room->description = $request->description;

        // Remove empty paragraph (tiptop editor always outputs at least one empty paragraph)
        if ($room->description == '<p></p>') {
            $room->description = null;
        }

        $room->save();

        Log::info('Changed description for room {room}', ['room' => $room->getLogLabel() ]);

        return new RoomSettings($room);
    }

    /**
     * Delete a room and all related data
     *
     * @param  Room                      $room
     * @return \Illuminate\Http\Response
     */
    public function destroy(Room $room)
    {
        $room->delete();

        Log::info('Deleted room {room}', ['room' => $room->getLogLabel() ]);

        return response()->noContent();
    }

    /**
     * List of all meeting of the given room
     *
     * @param  Room                                                        $room
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     * @throws AuthorizationException
     */
    public function meetings(Room $room)
    {
        $this->authorize('viewStatistics', $room);
        $meetings = $room->meetings()->orderByDesc('start')->whereNotNull('start');

        return \App\Http\Resources\Meeting::collection($meetings->paginate(setting('pagination_page_size')));
    }

    /**
     * add a room to the users favorites
     *
     * @param  Room                      $room
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
     * @param  Room                      $room
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
     * @param  Room                      $room
     * @param  TransferOwnershipRequest  $request
     * @return \Illuminate\Http\Response
     */
    public function transferOwnership(Room $room, TransferOwnershipRequest $request)
    {
        $oldOwner = $room->owner;
        $newOwner = User::findOrFail($request->user);

        DB::beginTransaction();

        try {
            //delete the new owner from the members if he is a member of the room
            if ($room->members->contains($newOwner)) {
                $room->members()->detach($newOwner);
            }

            $room->owner()->associate($newOwner);
            $room->save();

            //add old owner to the members
            if ($request->role) {
                $room->members()->attach($oldOwner, ['role' => $request->role]);
            }

            DB::commit();
            Log::info('Transferred room ownership of the room {room} from previous owner {oldOwner} to new owner {newOwner}', ['room' => $room->getLogLabel(), 'oldOwner' => $oldOwner->getLogLabel(), 'newOwner' => $newOwner->getLogLabel()]);
            if ($request->role) {
                Log::info('Changed role of previous owner {oldOwner} of the room {room} to the role {role}', ['oldOwner' => $oldOwner->getLogLabel(), 'room'=> $room->getLogLabel(), 'role' => RoomUserRole::from($request->role)->label()]);
            }

            return response()->noContent();
        } catch(\Exception $e) {
            DB::rollBack();
            Log::error('Failed to transfer ownership of the room {room} from previous owner {oldOwner} to new owner {newOwner}', ['room' => $room->getLogLabel(), 'oldOwner' => $oldOwner->getLogLabel(), 'newOwner' => $newOwner->getLogLabel()]);

            return abort(500);
        }
    }
}
