<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomDescription extends FormRequest
{
    public function rules()
    {
        return [
            'description' => 'nullable|string',
        ];
    }
}
