<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateRecordingRequest;
use App\Http\Resources\RecordingResource;
use App\Models\Recording;
use App\Models\RecordingFormat;
use App\Models\Room;
use Illuminate\Support\Collection;

class RecordingController extends Controller
{
    public function index(Room $room)
    {
        /* if (\Gate::allows('viewAllRecordings', $room)) {
             return RecordingResource::collection($room->recordings);
         }

         $availableRecordings = new Collection();
         foreach($room->recordings as $recording) {
             if ($recording->access === 'public') {
                 return RecordingResource::collection($room->recordings);
             }
         }*/

        return RecordingResource::collection($room->recordings);
    }

    public function show(Room $room, RecordingFormat $format)
    {
        if (!$format->recording->room->is($room)) {
            abort(404, __('app.errors.recording_not_found'));
        }

        $recordingId = $format->recording->id;

        session()->push($recordingId.'-'.$format->format, true );

        if ($format->format === 'presentation') {
            return response()->json(['url' => config('recording.player').'/'.$recordingId.'/']);
        }

        $resource = explode($recordingId.'/', $format->url, 2)[1];

        $resourceRoute = route('recording.resource', ['format' => $format->format, 'recording' => $recordingId, 'resource' => $resource]) . ($resource == '' ? '/' : '');

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
