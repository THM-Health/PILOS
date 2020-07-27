<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddRoomMember;
use App\Http\Requests\UpdateRoomSettings;
use App\Http\Resources\PrivateRoomFile;
use App\Http\Resources\RoomUser;
use App\Room;
use App\RoomFile;
use App\Server;
use App\User;
use Auth;
use Illuminate\Http\Request;

class RoomController extends Controller
{

    public function __construct()
    {
        $this->middleware(['auth:api_users','api'])->except(['show','join','start','joinMembership','leaveMembership']);

    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return ['data' => [
            'myRooms'     => \App\Http\Resources\Room::collection(Auth::user()->myRooms()->with('owner')->get()),
            'sharedRooms' => \App\Http\Resources\Room::collection(Auth::user()->sharedRooms()->with('owner')->get()),
            ]
        ];
    }

    private function checkAccess(Room $room, String $accessCode = null)
    {
        if (Auth::guest() && !$room->allowGuests) {
            abort(403);
        }

        if ($room->accessCode == null) {
            return true;
        }

        if ($accessCode) {
            if (is_numeric($accessCode) && $room->accessCode == $accessCode) {
                return true;
            } else {
                abort(401, 'invalid_code');
            }
        }
        if ($room->owner->is(Auth::user()) or $room->members->contains(Auth::user())) {
            return true;
        }

        return false;
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  int                      $id
     * @return \App\Http\Resources\Room
     */
    public function show(Room $room, Request $request)
    {
        $loggedIn = $this->checkAccess($room, $request->code);


        return new \App\Http\Resources\Room($room, $loggedIn);
    }

    public function getSettings(Room $room)
    {
        return new \App\Http\Resources\RoomSettings($room);
    }

    public function updateSettings(UpdateRoomSettings $request, Room $room)
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
        $room->allowSubscription              = $request->allowSubscription;
        $room->allowGuests                    = $request->allowGuests;

        $room->defaultRole = $request->defaultRole;
        $room->lobby       = $request->lobby;
        $room->roomType()->associate($request->roomType);

        $room->save();

        return new \App\Http\Resources\RoomSettings($room);
    }

    public function start(Room $room, Request $request)
    {
        if (!$this->checkAccess($room, $request->code)) {
            abort(401);
        }

        $name = Auth::guest() ? $request->name : Auth::user()->firstname.' '.Auth::user()->lastname;
        $id   = Auth::guest() ? session()->getId() : Auth::user()->username;

        $this->authorize('start', $room);

        $meeting = $room->runningMeeting();
        if (!$meeting) {
            $servers = Server::where('status', true)->get();
            $server  = $servers->random();

            $meeting = $room->meetings()->create();
            $meeting->server()->associate($server);
            $meeting->start       = date('Y-m-d H:i:s');
            $meeting->attendeePW  = bin2hex(random_bytes(5));
            $meeting->moderatorPW = bin2hex(random_bytes(5));
            $meeting->save();

            if (!$meeting->start()) {
                // @TODO Error
            }
        }

        return response()->json(['url'=>$meeting->getJoinUrl($name, $room->getRole(Auth::user()), $id)]);
    }

    public function join(Room $room, Request $request)
    {
        if (!$this->checkAccess($room, $request->code)) {
            abort(401);
        }

        $name = Auth::guest() ? $request->name : Auth::user()->firstname.' '.Auth::user()->lastname;
        $id   = Auth::guest() ? session()->getId() : Auth::user()->username;

        $meeting = $room->runningMeeting();
        if ($meeting == null) {
            return response()->json('not_running', 460);
        }

        if (!$meeting->start()) {
            // @TODO Error
        }

        return response()->json(['url'=>$meeting->getJoinUrl($name, $room->getRole(Auth::user()), $id)]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int                       $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int                       $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int                       $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }

    public function joinMembership(Room $room, Request $request)
    {
        if (!$room->allowSubscription) {
            abort(403);
        }
        if ($room->accessCode != null && (!$request->has('code') || !is_numeric($request->code) || $room->accessCode != $request->code)) {
            abort(401, 'invalid_code');
        }
        if (!$room->members->contains(Auth::user())) {
            $room->members()->attach(Auth::user()->id, ['role' => $room->defaultRole]);
        }
    }

    public function leaveMembership(Room $room)
    {
        $room->members()->detach(Auth::user()->id);
    }

    public function getMember(Room $room)
    {
        return RoomUser::collection($room->members);
    }

    public function addMember(Room $room, AddRoomMember $request)
    {
        $room->members()->attach($request->user, ['role' => $request->role]);
    }

    public function editMember(Room $room, User $user, Request $request)
    {
        $room->members()->updateExistingPivot($user, ['role' => $request->role]);
    }

    public function removeMember(Room $room, User $user)
    {
        $room->members()->detach($user);
    }

    public function uploadFile(Room $room, Request $request)
    {
        $name = $request->file('file')->getClientOriginalName();
        $path = $request->file('file')->store($room->id);

        $file               = new RoomFile();
        $file->path         = $path;
        $file->filename     = $name;
        $file->default      = $room->files->count() == 0;
        $file->useinmeeting = true;
        $room->files()->save($file);
    }

    public function getFiles(Room $room)
    {
        $default = $room->files()->where('default', true)->first();

        return ['data'=>['files'=>PrivateRoomFile::collection($room->files),'default'=>$default ? $default->id : null]];
    }

    public function updateFiles(Request $request, Room $room)
    {
        $file = $room->files()->findOrFail($request->defaultFile);

        $room->files()->update(['default' => false]);
        $file->default      = true;
        $file->useinmeeting = true;
        $file->save();
    }

    public function updateFile(Request $request, Room $room, RoomFile $file)
    {
        if (!$file->room->is($room)) {
            abort(404);
        }

        if ($request->has('useinmeeting')) {
            $file->useinmeeting = $request->useinmeeting;
        }
        if ($request->has('download')) {
            $file->download = $request->download;
        }
        $file->save();
    }

    public function deleteFile(Room $room, RoomFile $file)
    {
        if (!$file->room->is($room)) {
            abort(404);
        }

        $file->delete();
    }
}
