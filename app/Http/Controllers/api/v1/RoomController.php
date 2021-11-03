<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\CustomStatusCodes;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateRoom;
use App\Http\Requests\StartJoinMeeting;
use App\Http\Requests\UpdateRoomSettings;
use App\Http\Resources\RoomSettings;
use App\Meeting;
use App\Room;
use App\RoomType;
use Auth;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

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
    public function index(Request $request)
    {
        $collection     = null;
        $additionalMeta = [];

        if ($request->has('filter')) {
            switch ($request->filter) {
                case 'own':
                    $collection                                = Auth::user()->myRooms()->with('owner');
                    $additionalMeta['meta']['total_no_filter'] = $collection->count();

                    break;
                case 'shared':
                    $collection                                =  Auth::user()->sharedRooms()->with('owner');
                    $additionalMeta['meta']['total_no_filter'] = $collection->count();

                    break;
                default:
                    abort(400);
            }

            if ($request->has('search') && trim($request->search) != '') {
                $collection = $collection->where('name', 'like', '%' . $request->search . '%');
            }

            $collection = $collection->orderBy('name')->paginate(setting('own_rooms_pagination_page_size'));

            return \App\Http\Resources\Room::collection($collection)->additional($additionalMeta);
        }

        $collection =  Room::with('owner');
        if (Auth::user()->cannot('viewAll', Room::class)) {
            $collection = $collection
                ->where('listed', 1)
                ->whereNull('accessCode')
                ->whereIn('room_type_id', RoomType::where('allow_listing', 1)->get('id'));
        }

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

        if ($request->has('roomTypes')) {
            $collection->whereIn('room_type_id', $request->roomTypes);
        }

        $collection = $collection->orderBy('name')->paginate(setting('pagination_page_size'));

        return \App\Http\Resources\Room::collection($collection);
    }

    /**
     * Store a new created room
     *
     * @param  \Illuminate\Http\Request                               $request
     * @return \App\Http\Resources\Room|\Illuminate\Http\JsonResponse
     */
    public function store(CreateRoom $request)
    {
        if (Auth::user()->room_limit !== -1 && Auth::user()->myRooms()->count() >= Auth::user()->room_limit) {
            abort(CustomStatusCodes::ROOM_LIMIT_EXCEEDED, __('app.errors.room_limit_exceeded'));
        }

        $room             = new Room();
        $room->name       = $request->name;
        $room->accessCode = rand(111111111, 999999999);
        $room->roomType()->associate($request->roomType);
        $room->owner()->associate(Auth::user());
        $room->save();

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
     * @param  Room                                           $room
     * @param  Request                                        $request
     * @return \Illuminate\Http\JsonResponse
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function start(Room $room, StartJoinMeeting $request)
    {
        $token = $request->get('token');

        $this->authorize('start', [$room, $token]);

        if ($token) {
            $name = $token->fullname;
        } else {
            $name = Auth::guest() ? $request->name : Auth::user()->fullname;
        }
        $id   = Auth::guest() ? 's' . session()->getId() : 'u' . Auth::user()->id;

        // Atomic lock for room start to prevent users from simultaneously starting the same room
        // Maximum waiting time 45sec before failing
        $lock = Cache::lock('startroom-'.$room->id, config('bigbluebutton.server_timeout'));

        try {
            // Block the lock for a max. of 45sec
            $lock->block(config('bigbluebutton.server_timeout'));

            $meeting = $room->runningMeeting();
            if (!$meeting) {
                if ($room->roomTypeInvalid) {
                    $lock->release();
                    abort(CustomStatusCodes::ROOM_TYPE_INVALID, __('app.errors.room_type_invalid'));
                }

                // Check if user didn't see the attendance recording note, but the attendance is recorded
                if (setting('attendance.enabled') && $room->record_attendance && !$request->record_attendance) {
                    $lock->release();
                    abort(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING, __('app.errors.attendance_agreement_missing'));
                }

                // Create new meeting
                $meeting                    = new Meeting();
                $meeting->attendeePW        = bin2hex(random_bytes(5));
                $meeting->moderatorPW       = bin2hex(random_bytes(5));
                $meeting->record_attendance = setting('attendance.enabled') && $room->record_attendance;

                // Basic load balancing, get server with lowest usage
                $server = $room->roomType->serverPool->lowestUsage();

                // If no server found, throw error
                if ($server == null) {
                    $lock->release();
                    abort(CustomStatusCodes::NO_SERVER_AVAILABLE, __('app.errors.no_server_available'));
                }

                $meeting->server()->associate($server);
                $meeting->room()->associate($room);
                $meeting->save();

                // Try to start meeting
                try {
                    $result = $meeting->startMeeting();
                } // Catch exceptions, e.g. network connection issues
                catch (\Exception $exception) {
                    // Remove meeting and set server to offline
                    $meeting->forceDelete();
                    $server->apiCallFailed();
                    $lock->release();
                    abort(CustomStatusCodes::ROOM_START_FAILED, __('app.errors.room_start'));
                }

                // Check server response for meeting creation
                if (!$result->success()) {
                    // Meeting creation failed, remove meeting
                    $meeting->forceDelete();
                    // Check for some errors
                    switch ($result->getMessageKey()) {
                        // checksum error, api token invalid, set server to offline, try to create on other server
                        case 'checksumError':
                            $server->apiCallFailed();

                            break;
                        // for other unknown reasons, just respond, that room creation failed
                        // the error is probably server independent
                        default:
                            break;
                    }
                    $lock->release();
                    abort(CustomStatusCodes::ROOM_START_FAILED, __('app.errors.room_start'));
                }

                // Set start time after successful api call, prevents user from tying to join this meeting before it is ready
                $meeting->start = date('Y-m-d H:i:s');
                $meeting->save();
                $lock->release();
            } else {
                // meeting in still starting
                if ($meeting->start == null) {
                    $lock->release();
                    abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
                }
                // Check if the meeting is actually running on the server
                if (!$meeting->isRunning()) {
                    $meeting->setEnd();
                    $lock->release();
                    abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
                }

                // Check if user didn't see the attendance recording note, but the attendance is recorded
                if (setting('attendance.enabled') && $meeting->record_attendance && !$request->record_attendance) {
                    $lock->release();
                    abort(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING, __('app.errors.attendance_agreement_missing'));
                }
                $lock->release();
            }
        } catch (LockTimeoutException $e) {
            abort(CustomStatusCodes::ROOM_START_FAILED, __('app.errors.room_start'));
        }

        return response()->json([
            'url' => $meeting->getJoinUrl(
                $name,
                $room->getRole(Auth::user(), $token),
                $id,
                Auth::user() ? Auth::user()->bbb_skip_check_audio : false,
                Auth::user() ? Auth::user()->imageUrl : null
            )
        ]);
    }

    /**
     * Join a running meeting
     * @param  Room                          $room
     * @param  Request                       $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function join(Room $room, StartJoinMeeting $request)
    {
        $token = $request->get('token');

        if ($token) {
            $name = $token->fullname;
        } else {
            $name = Auth::guest() ? $request->name : Auth::user()->fullname;
        }
        $id   = Auth::guest() ? 's' . session()->getId() : 'u' . Auth::user()->id;

        // Check if there is a meeting running for this room, accordingly to the local database
        $meeting = $room->runningMeeting();
        // no meeting found
        if ($meeting == null) {
            abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
        }
        // meeting in still starting
        if ($meeting->start == null) {
            abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
        }

        // Check if the meeting is actually running on the server
        if (!$meeting->isRunning() ) {
            $meeting->setEnd();
            abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
        }

        // Check if user didn't see the attendance recording note, but the attendance is recorded
        if (setting('attendance.enabled') && $meeting->record_attendance && !$request->record_attendance) {
            abort(CustomStatusCodes::ATTENDANCE_AGREEMENT_MISSING, __('app.errors.attendance_agreement_missing'));
        }

        return response()->json([
            'url' => $meeting->getJoinUrl(
                $name,
                $room->getRole(Auth::user(), $token),
                $id,
                Auth::user() ? Auth::user()->bbb_skip_check_audio : false,
                Auth::user() ? Auth::user()->imageUrl : null
            )
        ]);
    }

    /**
     * Update room settings
     * @param  UpdateRoomSettings $request
     * @param  Room               $room
     * @param  Room               $room
     * @return RoomSettings
     */
    public function update(UpdateRoomSettings $request, Room $room)
    {
        $room->name            = $request->name;
        $room->welcome         = $request->welcome;
        $room->maxParticipants = $request->maxParticipants;
        $room->duration        = $request->duration;
        $room->accessCode      = $request->accessCode;
        $room->listed          = $request->listed;

        $room->muteOnStart                    = $request->muteOnStart;
        $room->lockSettingsDisableCam         = $request->lockSettingsDisableCam;
        $room->webcamsOnlyForModerator        = $request->webcamsOnlyForModerator;
        $room->lockSettingsDisableMic         = $request->lockSettingsDisableMic;
        $room->lockSettingsDisablePrivateChat = $request->lockSettingsDisablePrivateChat;
        $room->lockSettingsDisablePublicChat  = $request->lockSettingsDisablePublicChat;
        $room->lockSettingsDisableNote        = $request->lockSettingsDisableNote;
        $room->lockSettingsLockOnJoin         = $request->lockSettingsLockOnJoin;
        $room->lockSettingsHideUserList       = $request->lockSettingsHideUserList;
        $room->everyoneCanStart               = $request->everyoneCanStart;
        $room->allowMembership                = $request->allowMembership;
        $room->allowGuests                    = $request->allowGuests;

        $room->record_attendance              = $request->record_attendance;

        $room->defaultRole = $request->defaultRole;
        $room->lobby       = $request->lobby;
        $room->roomType()->associate($request->roomType);

        $room->save();

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

        return response()->noContent();
    }

    /**
     * List of all meeting of the given room
     *
     * @param  Room                                                        $room
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function meetings(Room $room)
    {
        $this->authorize('viewStatistics', $room);

        return \App\Http\Resources\Meeting::collection($room->meetings()->orderByDesc('start')->whereNotNull('start')->paginate(setting('pagination_page_size')));
    }
}
