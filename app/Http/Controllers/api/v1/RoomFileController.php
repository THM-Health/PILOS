<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddRoomMember;
use App\Http\Requests\StoreRoomFile;
use App\Http\Requests\UpdateRoomFile;
use App\Http\Resources\PrivateRoomFile;
use App\Http\Resources\RoomUser;
use App\Room;
use App\RoomFile;
use App\User;
use Illuminate\Http\Request;

class RoomFileController extends Controller
{
    /**
     * Display a listing of the resource.
     * @param Room $room
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Room $room)
    {
        $default = $room->files()->where('default', true)->first();
        return response()->json([
            'data'=> [
                'files'=>PrivateRoomFile::collection($room->files),
                'default'=>$default ? $default->id : null
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param StoreRoomFile $request
     * @param Room $room
     * @return \Illuminate\Http\Response
     */
    public function store(Room $room, StoreRoomFile $request)
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

    /**
     * Update the specified resource in storage.
     *
     * @param UpdateRoomFile $request
     * @param Room $room
     * @param RoomFile $file
     * @return \Illuminate\Http\Response
     */
    public function update(UpdateRoomFile $request, Room $room, RoomFile $file)
    {
        if (!$file->room->is($room)) {
            abort(404);
        }

        if ($request->has('useinmeeting')) {
            $file->useinmeeting = $request->useinmeeting;
            $file->save();
        }
        if ($request->has('download')) {
            $file->download = $request->download;
            $file->save();
        }

        if ($request->has('default') && $request->default === true) {
            $room->files()->update(['default' => false]);
            $file->default      = true;
            $file->useinmeeting = true;
            $file->save();
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param Room $room
     * @param RoomFile $file
     * @return \Illuminate\Http\Response
     */
    public function destroy(Room $room, RoomFile $file)
    {
        if (!$file->room->is($room)) {
            abort(404);
        }

        $file->delete();
    }
}
