<?php

namespace App\Http\Controllers;

use App\Enums\CustomStatusCodes;
use App\Exports\AttendanceExport;
use App\Models\Meeting;
use Illuminate\Auth\Access\AuthorizationException;
use Log;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Class MeetingController
 * @package App\Http\Controllers\api\v1
 */
class MeetingController extends Controller
{
    /**
     * Download attendance list as excel spreadsheet file
     * @param  Meeting                $meeting
     * @return BinaryFileResponse
     * @throws AuthorizationException
     */
    public function attendance(Meeting $meeting)
    {
        $this->authorize('viewStatistics', $meeting->room);

        Log::info('Download attendance list for meeting {meeting} of room {room}', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->id]);

        // check if attendance recording is enabled for this meeting
        if (!$meeting->record_attendance || !setting('attendance.enabled')) {
            Log::info('Failed to download attendance list for meeting {meeting} of room {room}; attendance is disabled', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->id]);
            abort(CustomStatusCodes::FEATURE_DISABLED, __('app.errors.meeting_attendance_disabled'));
        }

        // check if meeting is ended
        if ($meeting->end == null) {
            Log::info('Failed to download attendance list for meeting {meeting} of room {room}; meeting is still running', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->id]);
            abort(CustomStatusCodes::MEETING_ATTENDANCE_NOT_ENDED, __('app.errors.meeting_attendance_not_ended'));
        }

        return Excel::download(new AttendanceExport($meeting, \Auth::user()->timezone), __('meetings.attendance.filename').'.xlsx');
    }
}
