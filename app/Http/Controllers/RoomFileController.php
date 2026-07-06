<?php

// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\CustomErrorMessages;
use App\Models\Room;
use App\Models\RoomFile;
use App\Services\RoomFileService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Response;

/**
 * Class RoomFileController
 * Handle file management for rooms
 */
class RoomFileController extends Controller
{
    /**
     * Display/Download a file
     *
     * @return Response
     */
    public function show(Room $room, RoomFile $file)
    {
        // Check authorization
        try {
            $this->authorize('downloadFile', [$room, $file]);
        } catch (AuthorizationException $e) {
            // User is not authorized to download the file
            return response(view('new-tab-error', [
                'type' => CustomErrorMessages::FORBIDDEN->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.flash.file_forbidden'),
            ]))->setStatusCode(403);
        }

        $roomFileService = new RoomFileService($file);

        return $roomFileService->download();
    }

    /**
     * Display/Download a file without authorization check
     * (Needed to allow bbb server to access the presentation files)
     *
     * @return Response
     */
    public function showPresentation(RoomFile $roomFile)
    {
        $roomFileService = new RoomFileService($roomFile);

        return $roomFileService->download();
    }
}
