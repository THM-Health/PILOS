<?php

// SPDX-FileCopyrightText: 2021 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\CustomStatusCodes;
use App\Exports\AttendanceExport;
use App\Models\Meeting;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Class MeetingController
 */
class MeetingController extends Controller
{
    /**
     * Download attendance list as excel spreadsheet file
     *
     * @return BinaryFileResponse
     *
     * @throws AuthorizationException
     */
    public function attendance(Meeting $meeting)
    {
        $this->authorize('viewStatistics', $meeting->room);

        Log::info('Download attendance list for meeting {meeting} of room {room}', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->id]);

        // check if attendance recording is enabled for this meeting
        if (! $meeting->record_attendance) {
            Log::info('Failed to download attendance list for meeting {meeting} of room {room}; attendance is disabled', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->id]);
            abort(CustomStatusCodes::FEATURE_DISABLED->value, __('app.errors.meeting_attendance_disabled'));
        }

        // check if meeting is ended
        if ($meeting->end == null) {
            Log::info('Failed to download attendance list for meeting {meeting} of room {room}; meeting is still running', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->id]);
            abort(CustomStatusCodes::MEETING_ATTENDANCE_NOT_ENDED->value, __('app.errors.meeting_attendance_not_ended'));
        }

        return new AttendanceExport($meeting, Auth::user()->timezone)->toResponse();
    }
}
