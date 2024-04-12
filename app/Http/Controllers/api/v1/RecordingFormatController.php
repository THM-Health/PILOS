<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Models\Recording;
use App\Models\RecordingFormat;
use App\Models\Room;

class RecordingFormatController extends Controller
{
    public function show(Room $room, Recording $recording, RecordingFormat $format)
    {
        session()->push($recording->id.'-'.$format->format, true);

        if ($format->format === 'presentation') {
            return response()->json(['url' => config('recording.player').'/'.$recording->id.'/']);
        }

        $resource = explode($recording->id.'/', $format->url, 2)[1];

        $resourceRoute = route('recording.resource', ['format' => $format->format, 'recording' => $recording, 'resource' => $resource]).($resource == '' ? '/' : '');

        return response()->json(['url' => $resourceRoute]);
    }
}
