<?php

namespace App\Http\Controllers;

use App\Models\RoomFile;
use App\Services\RoomFileService;
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
        $roomFileService = new RoomFileService($roomFile);

        return $roomFileService->download();
    }
}
