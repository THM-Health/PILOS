<?php

// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\CustomErrorMessages;
use App\Models\Recording;
use App\Models\RecordingFormat;
use App\Models\Room;
use Illuminate\Auth\Access\AuthorizationException;

class RecordingFormatController extends Controller
{
    public function show(Room $room, Recording $recording, RecordingFormat $format)
    {
        // Check authorization
        try {
            $this->authorize('viewRecordingFormat', [$room, $format]);

        } catch (AuthorizationException $e) {
            // User is not authorized to view the recording format
            return response(view('new-tab-error', [
                'type' => CustomErrorMessages::FORBIDDEN->value,
                'code' => 403,
                'title' => 'Forbidden',
                'message' => __('rooms.flash.recording_forbidden'),
            ]))->setStatusCode(403);
        }

        // Set session variable to allow access to the recording format route
        session()->push('access-format-'.$format->id, true);

        if ($format->format === 'presentation') {
            // Presentation format -> redirect to player route
            return redirect(config('recording.player').'/'.$recording->id.'/');
        }

        // Other format -> redirect to resource route of the recording format
        $resource = explode($recording->id.'/', $format->url, 2)[1];

        $resourceRoute = route('recording.resource', ['formatName' => $format->format, 'recording' => $recording->id, 'resource' => $resource]).($resource == '' ? '/' : '');

        return redirect($resourceRoute);
    }
}
