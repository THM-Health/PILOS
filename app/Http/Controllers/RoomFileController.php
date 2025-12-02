<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\RoomFile;
use App\Services\RoomFileService;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Class RoomFileController
 * Handle file management for rooms
 */
class RoomFileController extends Controller
{
    /**
     * Display/Download a file
     *
     * @return StreamedResponse
     */
    public function show(Room $room, RoomFile $roomFile)
    {
        $roomFileService = new RoomFileService($roomFile);

        return $roomFileService->download();
    }
}
