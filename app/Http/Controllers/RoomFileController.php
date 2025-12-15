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
        // ToDo fix BBB file access
        try {
            $this->authorize('downloadFile', [$room, $roomFile]);
        } catch (AuthorizationException $e) {
            // User is not authorized to download the file
            return response(view('file-error', [
                'type' => 'forbidden',
            ]))->setStatusCode(403);
        }

        $roomFileService = new RoomFileService($roomFile);

        return $roomFileService->download();
    }
}
