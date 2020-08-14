<?php

namespace App\Http\Controllers;

use App\RoomFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Class FileController
 * Handle file management for rooms
 * @package App\Http\Controllers
 */
class FileController extends Controller
{
    /**
     * Display/Download a file
     *
     * @param  RoomFile         $roomFile
     * @return StreamedResponse
     */
    public function show(RoomFile $roomFile)
    {
        // Handle missing file on drive
        if (!Storage::exists($roomFile->path)) {
            try {
                $roomFile->delete();
            } catch (\Exception $exception) {
            }
            abort(404);
        }

        // Download file/view in browser
        return Storage::download($roomFile->path, $roomFile->filename, [
            'Content-Disposition' => 'inline; filename="'. $roomFile->filename .'"'
        ]);
    }
}
