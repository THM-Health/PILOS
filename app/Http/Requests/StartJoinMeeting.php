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
            'record_attendance' => 'required|boolean',
        ];
    }
}
