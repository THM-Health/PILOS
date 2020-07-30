<?php

namespace App\Http\Controllers;

use App\RoomFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Class FileController
 * Handle file management for rooms
 * @package App\Http\Controllers
 */
class FileController extends Controller
{
    /**
     * Display/Download a file of a room
     * Protected function with signed routes
     *
     * @param  RoomFile                                           $roomFile
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function show(Request $request, RoomFile $roomFile)
    {
        // If check enabled make sure the file is still allowed to be downloaded
        if ($request->has('check') && $roomFile->download === false) {
            abort(403);
        }

        // Download file/view in browser
        return Storage::download($roomFile->path, $roomFile->filename, [
            'Content-Disposition' => 'inline; filename="'. $roomFile->filename .'"'
        ]);
    }
}
