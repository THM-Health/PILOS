<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Rules\ValidName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Context;

class StartMeetingRequest extends FormRequest
{
    public function rules(): array
    {
        $personalizedLink = Context::getHidden("room.{$this->room->id}.personalized_link");

        $rules = [
            'name' => auth()->check() || $personalizedLink ? [] : ['bail', 'required', 'min:2', 'max:50', new ValidName],
            'dark_mode' => ['sometimes', 'boolean'],
        ];

        $rules += $this->getAttendanceRecordingRules();
        $rules += $this->getRecordingRules();
        $rules += $this->getStreamingRules();

        return $rules;

    }

    private function getAttendanceRecordingRules(): array
    {
        if ($this->room->getRoomSetting('record_attendance')) {
            return [
                'consent_record_attendance' => ['required', 'boolean', 'accepted'],
            ];
        }

        return [];
    }

    private function getRecordingRules(): array
    {
        if ($this->room->getRoomSetting('record')) {
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
        if ($streaming->enabled) {
            return [
                'consent_streaming' => ['required', 'boolean', 'accepted'],
            ];
        }

        return [];
    }
}
