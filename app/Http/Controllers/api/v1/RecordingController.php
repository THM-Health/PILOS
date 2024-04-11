<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\RecordingAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateRecordingRequest;
use App\Http\Resources\RecordingResource;
use App\Models\Recording;
use App\Models\RecordingFormat;
use App\Models\Room;
use Illuminate\Database\Eloquent\Builder;

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

    public function show(Room $room, RecordingFormat $format)
    {
        if (! $format->recording->room->is($room)) {
            abort(404, __('app.errors.recording_not_found'));
        }

        $recordingId = $format->recording->id;

        session()->push($recordingId.'-'.$format->format, true);

        if ($format->format === 'presentation') {
            return response()->json(['url' => config('recording.player').'/'.$recordingId.'/']);
        }

        $resource = explode($recordingId.'/', $format->url, 2)[1];

        $resourceRoute = route('recording.resource', ['format' => $format->format, 'recording' => $recordingId, 'resource' => $resource]).($resource == '' ? '/' : '');

        return response()->json(['url' => $resourceRoute]);
    }

    public function update(UpdateRecordingRequest $request, Room $room, Recording $recording)
    {
        if (! $recording->room->is($room)) {
            abort(404, __('app.errors.recording_not_found'));
        }

        $recording->description = $request->description;
        $recording->access = $request->access;
        $recording->save();

        foreach ($request->formats as $formatRequest) {
            $format = $recording->formats()->findOrFail($formatRequest['id']);
            $format->disabled = $formatRequest['disabled'];
            $format->save();
        }

        $recording->refresh();

        return $recording;
    }

    public function destroy(Room $room, Recording $recording)
    {
        if (! $recording->room->is($room)) {
            abort(404, __('app.errors.recording_not_found'));
        }

        $recording->delete();
    }
}
