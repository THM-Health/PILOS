<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\RoomFile;
use App\Services\RoomFileService;
use Illuminate\Auth\Access\AuthorizationException;
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
        // Check authorization // ToDo think about moving this to room file service
        try {
            $this->authorize('downloadFile', [$room, $roomFile]);
        } catch (AuthorizationException $e) {
            // User is not authorized to download the file
            return response(view('new-tab-error', [
                'type' => 'forbidden',
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.flash.file_forbidden'),
            ]))->setStatusCode(403);
        }

        $roomFileService = new RoomFileService($roomFile);

        return $roomFileService->download();
    }

    /**
     * Display/Download a file without authorization check
     * (Needed to allow bbb server to access the presentation files)
     *
     * @return StreamedResponse
     */
    public function showPresentation(Room $room, RoomFile $roomFile)
    {
        $roomFileService = new RoomFileService($roomFile);

        return $roomFileService->download(false);
    }
}
