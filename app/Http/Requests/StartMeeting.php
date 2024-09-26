<?php

namespace App\Http\Requests;

use App\Rules\ValidName;
use App\Services\RoomAuthService;
use Illuminate\Foundation\Http\FormRequest;

class StartMeeting extends FormRequest
{
    protected RoomAuthService $roomAuthService;

    public function __construct(RoomAuthService $roomAuthService)
    {
        parent::__construct();
        $this->roomAuthService = $roomAuthService;
    }

    public function rules()
    {
        $rules = [
            'name' => auth()->check() || $this->roomAuthService->getRoomToken($this->room) ? [] : ['required', 'min:2', 'max:50',  new ValidName],
            'consent_record_attendance' => ['required', 'boolean'],
            'consent_record' => ['required', 'boolean'], // Consent to join meeting with recording enabled
            'consent_record_video' => ['required', 'boolean'], // Permission to record own video
        ];

        // If the room is configured to record attendance, the user must agree to it
        if ($this->room->getRoomSetting('record_attendance')) {
            $rules['consent_record_attendance'][] = 'accepted';
        }

        // If the room is configured to record the meeting, the user must agree to it
        if ($this->room->getRoomSetting('record')) {
            $rules['consent_record'][] = 'accepted';
        }

        return $rules;

    }
}
