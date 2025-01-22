<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\RoomFile;
use App\Services\RoomAuthService;
use App\Services\RoomFileService;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Class FileController
 * Handle file management for rooms
 */
class FileController extends Controller
{
    /**
     * Display/Download a file
     *
     *  TODO cleanup, move to separate service, fix missing handling of bbb files access for a meeting
     *
     * @return StreamedResponse
     */
    public function show(Room $room, RoomFile $roomFile, RoomAuthService $roomAuthService)
    {
        $roomFileService = new RoomFileService($roomFile);

        if ($roomFile->download === true) {
            return $roomFileService->download();
        }

        if (\Auth::user()) {
            if (\Auth::user()->can('viewAllFiles', $room)) {
                return $roomFileService->download();
            }
        }

        abort(403);
    }
}
