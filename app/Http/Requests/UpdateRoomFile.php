<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomFile extends FormRequest
{
    public function rules()
    {
        return [
            'use_in_meeting' => 'sometimes|required|boolean',
            'download' => 'sometimes|required|boolean',
            'default' => 'sometimes|required|boolean',
        ];
    }
}
