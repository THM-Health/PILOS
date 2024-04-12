<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\RecordingAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateRecordingRequest;
use App\Http\Resources\RecordingResource;
use App\Models\Recording;
use App\Models\Room;
use Illuminate\Database\Eloquent\Builder;
use Log;

class RecordingController extends Controller
{
    public function index(Room $room)
    {
        $resource = $room->recordings()->with('formats')->has('formats');

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

        return RecordingResource::collection($resource->paginate(setting('pagination_page_size')));
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
