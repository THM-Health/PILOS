<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomFile extends FormRequest
{
    public function rules()
    {
        return [
            'use_in_meeting' => ['required', 'boolean'],
            'download' => ['required', 'boolean'],
            'default' => ['required', 'boolean'],
        ];
    }
}
