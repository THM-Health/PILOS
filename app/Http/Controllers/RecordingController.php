<?php

namespace App\Http\Controllers;

use App\Models\Recording;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipStream\ZipStream;

class RecordingController extends Controller
{
    public function resource(string $formatName, Recording $recording, string $resource = 'index.html'): \Illuminate\Http\Response
    {
        // Get format with the given name of the recording
        $format = $recording->formats()->where('format', $formatName)->firstOrFail();

        // Check session for permission to access recording
        if (! session()->exists('access-format-'.$format->id)) {
            abort(403);
        }

        // Allowed directory to read files from
        $allowedDir = $format->recording->id.'/'.$format->format;
        $requestedFile = $allowedDir.'/'.$resource;

        $absFilePath = realpath(Storage::disk('recordings')->path($requestedFile));

        // Check if file exists
        if ($absFilePath === false) {
            abort(404);
        }

        // Check if resolved requested file path is in allowed directory
        if (! str_contains($absFilePath, realpath(Storage::disk('recordings')->path($allowedDir)))) {
            // prevent path transversal
            \Log::notice('Attempted to access recording file outside of allowed directory', ['requestedFile' => $requestedFile]);
            abort(404);
        }

        $fileAlias = config('filesystems.x-accel.url_prefix').'/recordings/'.$requestedFile;

        return response(null, 200)
            ->header('Content-Type', null)
            ->header('X-Accel-Redirect', $fileAlias);
    }

    public function download(Recording $recording)
    {
        $this->authorize('viewAllRecordings', $recording->room);

        // Get all files in the recording directory, remove the root folder and filter the files by the whitelist
        $files = Collection::make(Storage::disk('recordings')->allFiles($recording->id))
            ->map(function (string $filename) use ($recording) {
                return explode($recording->id.'/', $filename, 2)[1];
            })
            ->filter(function (string $filename) {
                return preg_match('/'.config('recording.download_allowlist').'/', $filename);
            });

        $response = new StreamedResponse(function () use ($recording, $files) {
            // create a new zip stream
            $zip = new ZipStream(
                outputName: __('rooms.recordings.filename').'_'.$recording->start->format('Y-m-d').'.zip',
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
