<?php

namespace App\Http\Requests;

use App\Rules\ValidName;
use App\Services\RoomAuthService;
use Illuminate\Foundation\Http\FormRequest;

class StartJoinMeeting extends FormRequest
{
    protected RoomAuthService $roomAuthService;

    public function __construct(RoomAuthService $roomAuthService)
    {
        $this->roomAuthService = $roomAuthService;
    }

    public function rules()
    {
        return [
            'name' => auth()->check() || $this->roomAuthService->getRoomToken($this->room) ? [] : ['required', 'min:2', 'max:50',  new ValidName()],
            'record_attendance' => ['required', 'boolean'],
            'record' => ['required', 'boolean'], // Consent to join meeting with recording enabled
            'record_video' => ['required', 'boolean'], // Permission to record own video
        ];
    }
}
