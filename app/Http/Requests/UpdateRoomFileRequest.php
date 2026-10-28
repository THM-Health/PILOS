<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomFileRequest extends FormRequest
{
    public function rules()
    {
        return [
            'use_in_meeting' => ['required', 'boolean'],
            'download' => ['required', 'boolean'],
        ];
    }
}
