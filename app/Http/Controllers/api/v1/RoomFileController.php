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
use Log;

class RoomFileController extends Controller
{
    /**
     * Return a list of all files of a room and id of the default file
     *
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
     * @return PrivateRoomFileCollection|RoomFileCollection
     */
    public function store(Room $room, StoreRoomFile $request)
    {
        $name = $request->file('file')->getClientOriginalName();
        $path = $request->file('file')->store($room->id);

        $file = new RoomFile();
        $file->path = $path;
        $file->filename = $name;
        $room->files()->save($file);
        $room->updateDefaultFile();

        Log::info('Uploaded new file {file} to room {room}', ['room' => $room->getLogLabel(), 'file' => $file->getLogLabel()]);

        return $this->index($room);
    }

    /**
     * Get url to download the specified file
     *
     * @param  UpdateRoomFile  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Room $room, RoomFile $file)
    {
        $roomFileService = new RoomFileService($file);
        $url = $roomFileService->setTimeLimit(1)->url();

        return response()->json(['url' => $url]);
    }

    /**
     * Update the specified file attributes
     *
     * @return PrivateRoomFileCollection|RoomFileCollection
     */
    public function update(UpdateRoomFile $request, Room $room, RoomFile $file)
    {
        if ($request->has('use_in_meeting')) {
            $file->use_in_meeting = $request->use_in_meeting;
            // If no default file for this room is set, set this file as default
            if (! $room->files()->where('default', true)->exists()) {
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

        Log::info('Changed file settings for file {file} in room {room}', ['room' => $room->getLogLabel(), 'file' => $file->getLogLabel()]);

        $room->updateDefaultFile();

        return $this->index($room);
    }

    /**
     * Remove the specified file from storage and database.
     *
     * @return PrivateRoomFileCollection|RoomFileCollection
     *
     * @throws \Exception
     */
    public function destroy(Room $room, RoomFile $file)
    {
        $file->delete();
        $room->updateDefaultFile();

        Log::info('Deleted file {file} in room {room}', ['room' => $room->getLogLabel(), 'file' => $file->getLogLabel()]);

        return $this->index($room);
    }
}
