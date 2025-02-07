<?php

namespace App\Http\Requests;

use App\Rules\ValidName;
use App\Services\RoomAuthService;
use Illuminate\Foundation\Http\FormRequest;

class JoinMeeting extends FormRequest
{
    protected RoomAuthService $roomAuthService;

    public function __construct(RoomAuthService $roomAuthService)
    {
        parent::__construct();
        $this->roomAuthService = $roomAuthService;
    }

    public function rules(): array
    {
        $rules = [
            'name' => auth()->check() || $this->roomAuthService->getRoomToken($this->room) ? [] : ['required', 'min:2', 'max:50',  new ValidName],
        ];

        $rules += $this->getAttendanceRecordingRules();
        $rules += $this->getRecordingRules();
        $rules += $this->getStreamingRules();

        return $rules;
    }

    private function getAttendanceRecordingRules(): array
    {
        $meeting = $this->room->latestMeeting;
        if ($meeting?->record_attendance) {
            return [
                'consent_record_attendance' => ['required', 'boolean', 'accepted'],
            ];
        }

        return [];
    }

    private function getRecordingRules(): array
    {
        $meeting = $this->room->latestMeeting;
        if ($meeting?->record) {
            return [
                'consent_record' => ['required', 'boolean', 'accepted'], // Consent to join meeting with recording enabled
                'consent_record_video' => ['required', 'boolean'], // Permission to record own video
            ];
        }

        return [];
    }

    private function getStreamingRules(): array
    {
        $streaming = $this->room->streaming;
        if ($streaming->enabled_for_current_meeting) {
            return [
                'consent_streaming' => ['required', 'boolean', 'accepted'],
            ];
        }

        return [];
    }
}
