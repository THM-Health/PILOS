<?php

namespace App\Http\Controllers;

use App\Room;
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
     *
     * @param  RoomFile                                           $roomFile
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function show(Request $request, Room $room, RoomFile $roomFile)
    {
        if (!$roomFile->room->is($room)) {
            abort(404);
        }

        // Download file/view in browser
        return Storage::download($roomFile->path, $roomFile->filename, [
            'Content-Disposition' => 'inline; filename="'. $roomFile->filename .'"'
        ]);
    }

    /**
     * Display/Download a file for bbb
     *
     * @param  RoomFile                                           $roomFile
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function bbb(Request $request, RoomFile $roomFile)
    {
        // Download file/view in browser
        return Storage::download($roomFile->path, $roomFile->filename, [
            'Content-Disposition' => 'inline; filename="'. $roomFile->filename .'"'
        ]);
    }
}
