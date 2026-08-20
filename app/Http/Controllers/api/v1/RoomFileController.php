<?php

declare(strict_types=1);

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoomFileIndexRequest;
use App\Http\Requests\StoreRoomFileRequest;
use App\Http\Requests\UpdateRoomFileRequest;
use App\Http\Requests\UpdateRoomSystemDefaultPresentation;
use App\Http\Resources\PrivateRoomFileResource;
use App\Http\Resources\RoomFileResource;
use App\Models\Room;
use App\Models\RoomFile;
use App\Settings\BigBlueButtonSettings;
use App\Settings\GeneralSettings;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class RoomFileController extends Controller
{
    /**
     * Return a list of all files of a room and id of the default file
     *
     * @return AnonymousResourceCollection
     */
    public function index(Room $room, RoomFileIndexRequest $request)
    {
        $additional = [];

        // Sort by column, fallback/default is filename
        $sortBy = match ($request->query('sort_by')) {
            'uploaded' => 'created_at',
            default => 'filename',
        };

        // Sort direction, fallback/default is asc
        $sortOrder = match ($request->query('sort_direction')) {
            'desc' => 'desc',
            default => 'asc',
        };

        // Filter, default is no filter
        $filter = match ($request->query('filter')) {
            'use_in_meeting' => ['use_in_meeting', 1],
            'downloadable' => ['download', 1],
            default => null,
        };

        // Get all files of the room
        $resource = $room->files()->orderBy($sortBy, $sortOrder)->orderBy('room_files.id');

        // If user is not allowed to view all files, only query files that are downloadable
        if (! Gate::allows('viewAllFiles', $room)) {
            $resource = $resource->where('download', true);
        }

        // count all before applying filters
        $additional['meta']['total_no_filter'] = $resource->count();

        // Apply search filter
        if ($request->filled('query')) {
            $resource = $resource->where('filename', 'like', '%'.$request->query('query').'%');
        }

        // Apply filter if set, first element is the column, second the value to query
        if ($filter) {
            $resource = $resource->where($filter[0], $filter[1]);
        }

        // If user is allowed to view all files, return PrivateRoomFile resource to show additional information
        if (Gate::allows('viewAllFiles', $room)) {
            $additional['default'] = $room->files()->where('default', true)->first();
            $additional['system_default'] = [
                'file' => app(BigBlueButtonSettings::class)->default_presentation,
                'use_in_meeting' => $room->use_system_default_presentation_in_meeting,
                'use_as_default' => $room->use_system_default_presentation_as_default,
            ];

            return PrivateRoomFileResource::collection($resource->paginate(app(GeneralSettings::class)->pagination_page_size))->additional($additional);
        }

        return RoomFileResource::collection($resource->paginate(app(GeneralSettings::class)->pagination_page_size))->additional($additional);
    }

    /**
     * Store a new file in the storage
     *
     * @return Response
     */
    public function store(Room $room, StoreRoomFileRequest $request)
    {
        $name = $request->file('file')->getClientOriginalName();
        $path = $request->file('file')->store($room->id);

        $file = new RoomFile;
        $file->path = $path;
        $file->filename = $name;
        $room->files()->save($file);
        $room->updateDefaultFile();

        Log::info('Uploaded new file {file} to room {room}', ['room' => $room->getLogLabel(), 'file' => $file->getLogLabel()]);

        return response()->noContent();
    }

    /**
     * Update the specified file attributes
     *
     * @return Response
     */
    public function update(UpdateRoomFileRequest $request, Room $room, RoomFile $file)
    {
        if ($request->has('use_in_meeting')) {
            $file->use_in_meeting = $request->boolean('use_in_meeting');
        }

        if ($request->has('download')) {
            $file->download = $request->boolean('download');
        }

        if ($request->has('default')) {
            if ($request->boolean('default') === false) {
                $file->default = false;
            } else {
                // Make other files not the default
                $room->files()->whereNot('id', $file->id)->update(['default' => false]);
                // Set this file as default
                $file->default = true;

                // If a file is set as default, the system default presentation must not be used as default
                $room->use_system_default_presentation_as_default = false;
                $room->save();
            }
        }

        $file->save();

        Log::info('Changed file settings for file {file} in room {room}', ['room' => $room->getLogLabel(), 'file' => $file->getLogLabel()]);

        $room->updateDefaultFile();

        return response()->noContent();
    }

    public function updateSystemDefault(UpdateRoomSystemDefaultPresentation $request, Room $room)
    {
        if ($request->has('use_in_meeting')) {
            $room->use_system_default_presentation_in_meeting = $request->use_in_meeting;
        }

        if ($request->has('default')) {
            // Make other files not the default
            if ($request->default === true) {
                $room->files()->update(['default' => false]);

                // If system default is set as default, it must also be used in the next meeting
                $room->use_system_default_presentation_in_meeting = true;
            }

            $room->use_system_default_presentation_as_default = $request->default;
        }

        $room->save();

        Log::info('Changed system default presentation settings in room {room}', ['room' => $room->getLogLabel()]);

        $room->updateDefaultFile();

        return response()->noContent();
    }

    /**
     * Remove the specified file from storage and database.
     *
     * @return Response
     *
     * @throws \Exception
     */
    public function destroy(Room $room, RoomFile $file)
    {
        $file->delete();
        $room->updateDefaultFile();

        Log::info('Deleted file {file} in room {room}', ['room' => $room->getLogLabel(), 'file' => $file->getLogLabel()]);

        return response()->noContent();
    }
}
