<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\RecordingMode;
use App\Http\Controllers\Controller;
use App\Models\Recording;
use App\Models\RecordingFormat;
use App\Models\Room;

class RecordingFormatController extends Controller
{
    public function show(Room $room, Recording $recording, RecordingFormat $format)
    {
        if (config('recording.mode') !== RecordingMode::INTEGRATED) {
            abort(404);
        }

        session()->push('access-format-'.$format->id, true);

        if ($format->format === 'presentation') {
            return response()->json(['url' => config('recording.player').'/'.$recording->id.'/']);
        }

        $resource = explode($recording->id.'/', $format->url, 2)[1];

        $resourceRoute = route('recording.resource', ['formatName' => $format->format, 'recording' => $recording->id, 'resource' => $resource]).($resource == '' ? '/' : '');

        return response()->json(['url' => $resourceRoute]);
    }
}
