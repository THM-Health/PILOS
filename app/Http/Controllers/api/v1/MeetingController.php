<?php

namespace App\Http\Controllers\api\v1;

use App\Enums\CustomStatusCodes;
use App\Http\Controllers\Controller;
use App\Http\Resources\Attendee;
use App\Http\Resources\MeetingStat;
use App\Http\Resources\MeetingWithRoomAndServer as MeetingResource;
use App\Models\Meeting;
use App\Services\MeetingService;
use App\Settings\GeneralSettings;
use App\Settings\RecordingSettings;
use Illuminate\Http\Request;
use Log;

/**
 * Class MeetingController
 */
class MeetingController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Meeting::class, 'meeting');
    }

    /**
     * Display a listing of all currently running meetings
     *
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index(Request $request)
    {
        $additionalMeta = [];

        // Load meetings, rooms, owners and servers
        $resource = Meeting::query()
            ->join('rooms as room', 'meetings.room_id', '=', 'room.id')
            ->join('users as user', 'room.user_id', '=', 'user.id')
            ->join('servers as server', 'meetings.server_id', '=', 'server.id')
            ->select('meetings.*');

        // Filter only running meetings
        $resource = $resource->whereNull('end')->whereNotNull('start');

        // count all running meetings before search
        $additionalMeta['meta']['total_no_filter'] = $resource->count();

        // And-search, sub queries split by space
        if ($request->has('search') && trim($request->search) != '') {
            $searchQueries = explode(' ', preg_replace('/\s\s+/', ' ', $request->search));
            foreach ($searchQueries as $searchQuery) {
                $resource = $resource->where(function ($query) use ($searchQuery) {
                    $query->whereHas('room', function ($subQuery) use ($searchQuery) {
                        $subQuery->whereLike('name', '%'.$searchQuery.'%');
                    })
                        ->orWhereHas('room.owner', function ($subQuery) use ($searchQuery) {
                            $subQuery->whereLike('firstname', '%'.$searchQuery.'%')
                                ->orWhereLike('lastname', '%'.$searchQuery.'%');
                        })
                        ->orWhereHas('server', function ($subQuery) use ($searchQuery) {
                            $subQuery->whereLike('name', '%'.$searchQuery.'%');
                        });
                });
            }
        }

        // Sort by column, fallback/default is start
        $sortBy = match ($request->query('sort_by')) {
            'room.participant_count' => 'room.participant_count',
            'room.listener_count' => 'room.listener_count',
            'room.voice_participant_count' => 'room.voice_participant_count',
            'room.video_count' => 'room.video_count',
            default => 'start',
        };

        // Sort direction, fallback/default is asc
        $sortOrder = match ($request->query('sort_direction')) {
            'desc' => 'DESC',
            default => 'ASC',
        };
        $resource = $resource->orderByRaw($sortBy.' '.$sortOrder)->orderBy('meetings.id');

        // Respond with paginated result
        $resource = $resource->paginate(app(GeneralSettings::class)->pagination_page_size);

        return MeetingResource::collection($resource)->additional($additionalMeta);
    }

    /**
     * Callback from bbb-server to notify about the end of the meeting
     */
    public function endMeetingCallback(Request $request, Meeting $meeting)
    {
        Log::info('Received end meeting request from BBB sever for meeting {meeting} of room {room}', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->id]);

        $meetingService = new MeetingService($meeting);
        // Validate request
        if (! $meetingService->validateCallbackSalt($request->salt)) {
            Log::warning('Invalid end meeting request; invalid salt');
            abort(401);
        }

        // Only set end of meeting, if not set before
        if ($meeting->end == null) {
            // Set end of meeting
            $meetingService->setEnd();
        }
    }

    /**
     * Usage statistics for this meeting (count of participants, voices, videos)
     *
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function stats(Meeting $meeting)
    {
        $this->authorize('viewStatistics', $meeting->room);

        Log::info('Show statistics for meeting {meeting} of room {room}', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->id]);

        // check if statistical data is globally enabled
        if (! app(RecordingSettings::class)->meeting_usage_enabled) {
            Log::info('Failed to show statistics for meeting {meeting} of room {room}; statistics are disabled', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->id]);
            abort(CustomStatusCodes::FEATURE_DISABLED->value, __('app.errors.meeting_statistics_disabled'));
        }

        return MeetingStat::collection($meeting->stats()->orderBy('created_at')->get());
    }

    /**
     * Attendance of users and guests during a meeting
     *
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function attendance(Meeting $meeting)
    {
        $this->authorize('viewStatistics', $meeting->room);

        Log::info('Show attendace for meeting {meeting} of room {room}', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->id]);

        $meetingService = new MeetingService($meeting);

        // check if attendance recording is enabled for this meeting
        if (! $meeting->record_attendance) {
            Log::info('Failed to show attendace for meeting {meeting} of room {room}; attendance is disabled', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->id]);
            abort(CustomStatusCodes::MEETING_ATTENDANCE_DISABLED->value, __('app.errors.meeting_attendance_disabled'));
        }

        // check if meeting is ended
        if ($meeting->end == null) {
            Log::info('Failed to show attendace for meeting {meeting} of room {room}; meeting is still running', ['room' => $meeting->room->getLogLabel(), 'meeting' => $meeting->id]);
            abort(CustomStatusCodes::MEETING_ATTENDANCE_NOT_ENDED->value, __('app.errors.meeting_attendance_not_ended'));
        }

        return Attendee::collection($meetingService->attendance());
    }
}
