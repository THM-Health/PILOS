<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoomFile;
use App\Http\Requests\UpdateRoomFile;
use App\Http\Resources\PrivateRoomFileCollection;
use App\Http\Resources\RoomFileCollection;
use App\Models\Room;
use App\Models\RoomFile;
use App\Services\RoomFileService;

class RoomFileController extends Controller
{
    /**
     * Return a list of all files of a room and id of the default file
     * @param  Room                                         $room
     * @return PrivateRoomFileCollection|RoomFileCollection
     */
    public function index(Room $room)
    {
        if (\Gate::allows('viewAllFiles', $room)) {
            $default = $room->files()->where('default', true)->first();

            return new PrivateRoomFileCollection($room->files, $default);
        }

        return new RoomFileCollection($room->files()->where('download', true)->get());
    }

    /**
     * Store a new file in the storage
     *
     * @param  StoreRoomFile                                $request
     * @param  Room                                         $room
     * @return PrivateRoomFileCollection|RoomFileCollection
     */
    public function store(Room $room, StoreRoomFile $request)
    {
        $name = $request->file('file')->getClientOriginalName();
        $path = $request->file('file')->store($room->id);

        $file               = new RoomFile();
        $file->path         = $path;
        $file->filename     = $name;
        $room->files()->save($file);
        $room->updateDefaultFile();

        return $this->index($room);
    }

    /**
     * Update the specified file attributes
     *
     * @param  UpdateRoomFile                $request
     * @param  Room                          $room
     * @param  RoomFile                      $file
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Room $room, RoomFile $file)
    {
        if (!$file->room->is($room)) {
            abort(404, __('app.errors.file_not_found'));
        }

        $roomFileService = new RoomFileService($file);
        $url             = $roomFileService->setTimeLimit(1)->url();

        return response()->json(['url' => $url]);
    }

    /**
     * Update the specified file attributes
     *
     * @param  UpdateRoomFile                               $request
     * @param  Room                                         $room
     * @param  RoomFile                                     $file
     * @return PrivateRoomFileCollection|RoomFileCollection
     */
    public function update(UpdateRoomFile $request, Room $room, RoomFile $file)
    {
        if (!$file->room->is($room)) {
            abort(404, __('app.errors.file_not_found'));
        }

        if ($request->has('use_in_meeting')) {
            $file->use_in_meeting = $request->use_in_meeting;
            // If no default file for this room is set, set this file as default
            if (!$room->files()->where('default', true)->exists()) {
                $file->default = true;
            }
        }

        if ($request->has('download')) {
            $file->download = $request->download;
        }

        if ($request->has('default') && $request->default === true) {
            // Make other files not the default
            $room->files()->update(['default' => false]);
            // Set this file as default
            $file->refresh();
            $file->default = true;
        }

        $file->save();

        $room->updateDefaultFile();

        return $this->index($room);
    }

    /**
     * Remove the specified file from storage and database.
     *
     * @param  Room                                         $room
     * @param  RoomFile                                     $file
     * @return PrivateRoomFileCollection|RoomFileCollection
     * @throws \Exception
     */
    public function destroy(Room $room, RoomFile $file)
    {
        if (!$file->room->is($room)) {
            abort(404, __('app.errors.file_not_found'));
        }

        $file->delete();
        $room->updateDefaultFile();

        return $this->index($room);
    }
}
