<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class RecordingController extends Controller
{
    /**
     * @param  string   $format
     * @param  string   $meeting
     * @param  string   $resource
     * @return Response
     */
    public function resource(string $format, string $meeting, string $resource = 'index.html'): \Illuminate\Http\Response
    {
        // Try to find meeting with the provided internal_meeting_id, else return 404
        $meeting = Meeting::where('internal_meeting_id', $meeting)->first();
        if ($meeting == null) {
            abort(404);
        }

        if (!session()->exists($meeting->internal_meeting_id.'-'.$format)) {
            abort(403);
        }

        // Allowed directory to read files from
        $allowedDir    = $meeting->room->id.'/'.$meeting->id.'/'.$format;
        $requestedFile = $allowedDir.'/'.$resource;

        // Check if resolved requested file path is in allowed directory
        if (!str_contains(realpath(Storage::disk('recordings')->path($requestedFile)), realpath(Storage::disk('recordings')->path($allowedDir)))) {
            // prevent path transversal
            abort(404);
        }

        // Check if the requested file exists
        if (!Storage::disk('recordings')->exists($requestedFile)) {
            abort(404);
        }

        $fileAlias = config('filesystems.x-accel.url_prefix').'/recordings/'.$requestedFile;
        $fileSize  = Storage::disk('recordings')->size($requestedFile);
        $fileMime  = Storage::disk('recordings')->mimeType($requestedFile);

        return response(null, 200)
            ->header('Content-Type', $fileMime)
            ->header('Content-Length', $fileSize )
            ->header('Content-Transfer-Encoding', 'binary')
            ->header('X-Accel-Redirect', $fileAlias);
    }
}
