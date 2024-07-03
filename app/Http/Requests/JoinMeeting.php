<?php

namespace App\Http\Requests;

use App\Rules\ValidName;
use App\Services\RoomAuthService;
use Illuminate\Foundation\Http\FormRequest;

class JoinMeeting extends FormRequest
{
    protected RoomAuthService $roomAuthService;

    public function __construct(RoomAuthService $roomAuthService){
        parent::__construct();
        $this->roomAuthService = $roomAuthService;
    }

    public function rules()
    {
        $rules = [
            'name' => auth()->check() || $this->roomAuthService->getRoomToken($this->room) ? [] : ['required', 'min:2', 'max:50',  new ValidName()],
            'consent_record_attendance' => ['required', 'boolean'],
            'consent_record' => ['required', 'boolean'], // Consent to join meeting with recording enabled
            'consent_record_video' => ['required', 'boolean'], // Permission to record own video
        ];

        $meeting = $this->room->latestMeeting;

        // If running meeting was started with attendance recording, the user must agree to it
        if ($meeting?->record_attendance) {
            $rules['consent_record_attendance'][] = 'accepted';
        }

        // If running meeting was started with recording, the user must agree to it
        if ($meeting?->record) {
            $rules['consent_record'][] = 'accepted';
        }

        return $rules;
    }
}
