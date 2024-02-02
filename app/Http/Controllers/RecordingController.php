<?php

namespace App\Http\Controllers;

use App\Models\Recording;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class RecordingController extends Controller
{
    /**
     * @param  string    $format
     * @param  Recording $recording
     * @param  string    $resource
     * @return Response
     */
    public function resource(string $format, Recording $recording, string $resource = 'index.html'): \Illuminate\Http\Response
    {
        // Check session for permission to access recording
        if (!session()->exists($recording->id.'-'.$format)) {
            abort(403);
        }

        // Allowed directory to read files from
        $allowedDir    = $recording->id.'/'.$format;
        $requestedFile = $allowedDir.'/'.$resource;

        $absFilePath = realpath(Storage::disk('recordings')->path($requestedFile));

        // Check if file exists
        if ($absFilePath === false) {
            abort(404);
        }

        // Check if resolved requested file path is in allowed directory
        if (!str_contains($absFilePath, realpath(Storage::disk('recordings')->path($allowedDir)))) {
            // prevent path transversal
            abort(404);
        }

        $fileAlias = config('filesystems.x-accel.url_prefix').'/recordings/'.$requestedFile;
        
        return response(null, 200)
            ->header('Content-Type', null)
            ->header('X-Accel-Redirect', $fileAlias);
    }
}
