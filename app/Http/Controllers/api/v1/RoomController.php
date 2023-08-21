<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\CustomStatusCodes;
use App\Enums\RoomSortingType;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateRoom;
use App\Http\Requests\ShowRoomsRequest;
use App\Http\Requests\StartJoinMeeting;
use App\Http\Requests\UpdateRoomDescription;
use App\Http\Requests\UpdateRoomSettings;
use App\Http\Resources\RoomSettings;
use App\Models\Room;
use App\Models\RoomType;
use App\Services\RoomService;
use Auth;
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
        $collection     = null;
        $additionalMeta = [];

        if ($request->only_favorites) {
            //list if room favourites
            $roomFavorites = Auth::user()->roomFavorites->modelKeys();
            $collection    = Room::whereIn('rooms.id', $roomFavorites);
        } else {
            // all rooms without limitation (always include own rooms, shared rooms and public rooms)
            if ($request->filter_all && Auth::user()->can('viewAll', Room::class)) {
                $collection = Room::query();
            } else {
                // list of room types for which listing is enabled
                $roomTypesWithListingEnabled = RoomType::where('allow_listing', 1)->get('id');

                // list of room ids where the user is member
                $roomMemberships             = Auth::user()->sharedRooms->modelKeys();

                $collection = Room::where(function (Builder $query) use ($roomTypesWithListingEnabled, $roomMemberships, $request) {
                    // own rooms
                    if ($request->filter_own) {
                        $query->orWhere('user_id', '=', Auth::user()->id);
                    }

                    // rooms where the user is member
                    if ($request->filter_shared) {
                        $query->orWhereIn('rooms.id', $roomMemberships);
                    }

                    // all rooms that are public (listed and without access code)
                    if ($request->filter_public) {
                        $query->orWhere(function (Builder $subQuery) use ($roomTypesWithListingEnabled) {
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

        // filter by specific room Type if not only favorites
        if ($request->has('room_type') && !$request->only_favorites) {
            $collection->where('room_type_id', $request->room_type);
        }

        // count all available rooms before search
        $additionalMeta['meta']['total_no_filter'] = $collection->count();

        // rooms that can be found with the search
        if ($request->has('search') && trim($request->search) != '') {
            $searchQueries  =  explode(' ', preg_replace('/\s\s+/', ' ', $request->search));
            foreach ($searchQueries as $searchQuery) {
                $collection = $collection->where(function ($query) use ($searchQuery) {
                    $query->where('name', 'like', '%' . $searchQuery . '%')
                        ->orWhereHas('owner', function ($query2) use ($searchQuery) {
                            $query2->where('firstname', 'like', '%' . $searchQuery . '%')
                                ->orWhere('lastname', 'like', '%' . $searchQuery . '%');
                        });
                });
            }
        }
        // sort rooms by different strategies
        switch($request->sort_by) {
            case RoomSortingType::ALPHA:
                $collection = $collection->orderBy('rooms.name');

                break;
            case RoomSortingType::ROOM_TYPE:
                $collection = $collection->orderBy('room_types.description')->orderBy('rooms.name');

                break;
            case RoomSortingType::LAST_ACTIVE:
            default:
                // 1. Sort by running state, 2. Sort by last meeting start date, 3. Sort by room name
                $collection = $collection->orderByRaw('meetings.start IS NULL ASC')->orderByRaw('meetings.end IS NULL DESC')->orderByDesc('meetings.start')->orderBy('rooms.name');

                break;
        }

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
        if (Auth::user()->room_limit !== -1 && Auth::user()->myRooms()->count() >= Auth::user()->room_limit) {
            abort(CustomStatusCodes::ROOM_LIMIT_EXCEEDED, __('app.errors.room_limit_exceeded'));
        }

        $room              = new Room();
        $room->name        = $request->name;
        $room->access_code = rand(111111111, 999999999);
        $room->roomType()->associate($request->room_type);
        $room->owner()->associate(Auth::user());
        $room->save();

        Log::info('Created new room {room}', ['room' => $room->getLogLabel()]);

        return new \App\Http\Resources\Room($room, true);
    }

    /**
     * Return all general room details
     *
     * @param  Room                     $room
     * @return \App\Http\Resources\Room
     */
    public function show(Room $room, Request $request)
    {
        return new \App\Http\Resources\Room($room, $request->authenticated, true, $request->token);
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
    public function start(Room $room, StartJoinMeeting $request)
    {
        $this->authorize('start', [$room, $request->get('token')]);

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
        $room->max_participants = $request->max_participants;
        $room->duration         = $request->duration;
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
}
