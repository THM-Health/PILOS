<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateRecordingRequest;
use App\Http\Resources\RecordingResource;
use App\Models\Recording;
use App\Models\RecordingFormat;
use App\Models\Room;

class RecordingController extends Controller
{
    public function index(Room $room)
    {
        return RecordingResource::collection($room->recordings);
    }

    public function show(Room $room, RecordingFormat $format)
    {
        if (!$format->recording->meeting->room->is($room)) {
            abort(404, __('app.errors.recording_not_found'));
        }

        $internalMeetingId = $format->recording->meeting->internal_meeting_id;

        session()->push($internalMeetingId.'-'.$format->format, true );

        if ($format->format === 'presentation') {
            return response()->json(['url' => config('recording.player').'/'.$internalMeetingId.'/']);
        }

        $resource = explode($internalMeetingId.'/', $format->url, 2)[1];

        $resourceRoute = route('recording.resource', ['format' => $format->format, 'meeting' => $internalMeetingId, 'resource' => $resource]) . ($resource == '' ? '/' : '');

        return response()->json(['url' => $resourceRoute]);

        //\Session::push($recording->meeting->id, $request->accessCode);
    }

    public function update(UpdateRecordingRequest $request, Room $room, Recording $recording)
    {
        $recording->description = $request->description;
        $recording->access      = $request->access;
        $recording->save();

        foreach ($request->formats as $formatRequest) {
            $format           = $recording->formats()->findOrFail($formatRequest['id']);
            $format->disabled = $formatRequest['disabled'];
            $format->save();
        }

        $recording->refresh();

        return $recording;
    }

    public function destroy(Recording $recording)
    {
    }
}
