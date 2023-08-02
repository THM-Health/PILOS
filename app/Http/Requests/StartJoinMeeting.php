<?php

namespace App\Http\Requests;

use App\Rules\ValidName;
use Illuminate\Foundation\Http\FormRequest;

class StartJoinMeeting extends FormRequest
{
    public function rules()
    {
        return [
            'name'              => auth()->check() || $this->filled('token') ? '' : ['required','min:2','max:50',  new ValidName() ],
            'record_attendance' => 'required|boolean', // Consent to join meeting with attendance recording enabled
            'record'            => 'required|boolean', // Consent to join meeting with recording enabled
            'record_video'      => 'required|boolean', // Permission to record own video

        ];
    }
}
