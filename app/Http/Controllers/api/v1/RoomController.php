<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\CustomStatusCodes;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateRoom;
use App\Http\Requests\StartJoinMeeting;
use App\Http\Requests\UpdateRoomSettings;
use App\Http\Resources\RoomSettings;
use App\Room;
use App\Server;
use Auth;
use http\Env\Response;
use Illuminate\Http\Request;
use InvalidArgumentException;

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
        if ($request->has('filter')) {
            if ($request->filter === 'own') {
                return \App\Http\Resources\Room::collection(Auth::user()->myRooms()->with('owner')->orderBy('name')->get());
            }

            if ($request->filter === 'shared') {
                return \App\Http\Resources\Room::collection(Auth::user()->sharedRooms()->with('owner')->orderBy('name')->get());
            }
        }

        return response()->noContent();
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
        return new \App\Http\Resources\Room($room, $request->authenticated, true);
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
        $this->authorize('start', $room);

        $name = Auth::guest() ? $request->name : Auth::user()->firstname.' '.Auth::user()->lastname;
        $id   = Auth::guest() ? session()->getId() : Auth::user()->username;

        $meeting = $room->runningMeeting();
        if (!$meeting) {
            $servers = Server::where('status', true)->get();

            try {
                $server = $servers->random();
            } catch (InvalidArgumentException $ex) {
                abort(CustomStatusCodes::NO_SERVER_AVAILABLE, __('app.errors.no_server_available'));
            }

            $meeting = $room->meetings()->create();
            $meeting->server()->associate($server);
            $meeting->start       = date('Y-m-d H:i:s');
            $meeting->attendeePW  = bin2hex(random_bytes(5));
            $meeting->moderatorPW = bin2hex(random_bytes(5));
            $meeting->save();

            if (!$meeting->startMeeting()) {
                abort(CustomStatusCodes::ROOM_START_FAILED, __('app.errors.room_start'));
            }
        }

        return response()->json(['url'=>$meeting->getJoinUrl($name, $room->getRole(Auth::user()), $id)]);
    }

    /**
     * Join an existing meeting
     * @param  Room                          $room
     * @param  Request                       $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function join(Room $room, StartJoinMeeting $request)
    {
        $name = Auth::guest() ? $request->name : Auth::user()->firstname.' '.Auth::user()->lastname;
        $id   = Auth::guest() ? session()->getId() : Auth::user()->username;

        $meeting = $room->runningMeeting();

        if ($meeting == null) {
            abort(CustomStatusCodes::MEETING_NOT_RUNNING, __('app.errors.not_running'));
        }

        if (!$meeting->startMeeting()) {
            abort(CustomStatusCodes::ROOM_START_FAILED, __('app.errors.room_start'));
        }

        return response()->json(['url'=>$meeting->getJoinUrl($name, $room->getRole(Auth::user()), $id)]);
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
}
