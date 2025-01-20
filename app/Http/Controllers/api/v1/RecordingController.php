<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\RecordingAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateRecordingRequest;
use App\Http\Resources\RecordingResource;
use App\Models\Recording;
use App\Models\Room;
use App\Settings\GeneralSettings;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Log;

class RecordingController extends Controller
{
    public function index(Room $room, Request $request)
    {
        $additional = [];

        // Sort by column, fallback/default is description
        $sortBy = match ($request->query('sort_by')) {
            'start' => 'start',
            default => 'LOWER(description)',
        };

        // Sort direction, fallback/default is asc
        $sortOrder = match ($request->query('sort_direction')) {
            'desc' => 'DESC',
            default => 'ASC',
        };

        // Filter, default is no filter
        $filter = match ($request->query('filter')) {
            'everyone_access' => ['access', RecordingAccess::EVERYONE],
            'participant_access' => ['access', RecordingAccess::PARTICIPANT],
            'moderator_access' => ['access', RecordingAccess::MODERATOR],
            'owner_access' => ['access', RecordingAccess::OWNER],
            default => null,
        };

        // Get all recordings of the room
        $resource = $room->recordings()->with('formats')->has('formats')->orderByRaw($sortBy.' '.$sortOrder)->orderBy('recordings.id');

        // If user is not allowed to view all recordings, only query recordings that should be visible to the user
        if (! \Gate::allows('viewAllRecordings', $room)) {
            $allowedAccess = [RecordingAccess::EVERYONE];

            if ($room->isModerator(\Auth::user())) {
                $allowedAccess[] = RecordingAccess::MODERATOR;
                $allowedAccess[] = RecordingAccess::PARTICIPANT;
            } elseif ($room->isMember(\Auth::user())) {
                $allowedAccess[] = RecordingAccess::PARTICIPANT;
            }

            $resource = $resource->whereIn('access', $allowedAccess)->whereHas('formats', function (Builder $query) {
                $query->where('disabled', false);
            });
        }

        // count all before applying filters
        $additional['meta']['total_no_filter'] = $resource->count();

        // Apply search filter
        if ($request->has('search')) {
            $resource = $resource->whereLike('description', '%'.$request->query('search').'%');
        }

        // Apply filter if set, first element is the column, second the value to query
        if ($filter) {
            $resource = $resource->where($filter[0], $filter[1]);
        }

        return RecordingResource::collection($resource->paginate(app(GeneralSettings::class)->pagination_page_size))->additional($additional);
    }

    public function update(UpdateRecordingRequest $request, Room $room, Recording $recording)
    {
        $recording->description = $request->description;
        $recording->access = $request->access;
        $recording->save();

        foreach ($request->formats as $formatRequest) {
            $format = $recording->formats()->findOrFail($formatRequest['id']);
            $format->disabled = $formatRequest['disabled'];
            $format->save();
        }

        $recording->refresh();

        return new RecordingResource($recording);
    }

    public function destroy(Room $room, Recording $recording)
    {
        Log::info('Deleted recording {recording} in room {room}', ['room' => $room->getLogLabel(), 'recording' => $recording->getLogLabel()]);

        $recording->delete();

        return response()->noContent();
    }
}
