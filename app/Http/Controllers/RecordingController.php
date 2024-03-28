<?php

namespace App\Http\Controllers;

use App\Models\Recording;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipStream\ZipStream;

class RecordingController extends Controller
{
    public function resource(string $format, Recording $recording, string $resource = 'index.html'): \Illuminate\Http\Response
    {
        // Check session for permission to access recording
        if (! session()->exists($recording->id.'-'.$format)) {
            abort(403);
        }

        // Allowed directory to read files from
        $allowedDir = $recording->id.'/'.$format;
        $requestedFile = $allowedDir.'/'.$resource;

        $absFilePath = realpath(Storage::disk('recordings')->path($requestedFile));

        // Check if file exists
        if ($absFilePath === false) {
            abort(404);
        }

        // Check if resolved requested file path is in allowed directory
        if (! str_contains($absFilePath, realpath(Storage::disk('recordings')->path($allowedDir)))) {
            // prevent path transversal
            abort(404);
        }

        $fileAlias = config('filesystems.x-accel.url_prefix').'/recordings/'.$requestedFile;

        return response(null, 200)
            ->header('Content-Type', null)
            ->header('X-Accel-Redirect', $fileAlias);
    }

    public function download(Recording $recording)
    {
        $this->authorize('manageRecordings', $recording->room);

        // Get all files in the recording directory, remove the root folder and filter the files by the whitelist
        $files = Collection::make(Storage::disk('recordings')->allFiles($recording->id))
            ->map(function (string $filename) use ($recording) {
                return explode($recording->id.'/', $filename, 2)[1];
            })
            ->filter(function (string $filename) {
                return preg_match('/'.config('recording.recording_download_whitelist').'/', $filename);
            });

        $response = new StreamedResponse(function () use ($recording, $files) {
            // create a new zip stream
            $zip = new ZipStream(
                outputName: __('rooms.recordings.filename').'_'.$recording->meeting->start->format('Y-m-d').'.zip',
                contentType: 'application/octet-stream',
            );

            // add all filtered files
            foreach ($files as $file) {
                $zip->addFileFromPath(
                    fileName: $file,
                    path: Storage::disk('recordings')->path($recording->id.'/'.$file),
                );
            }

            // finish the zip file
            $zip->finish();
        });
        $response->headers->set('X-Accel-Buffering', 'no');

        return $response;
    }
}
