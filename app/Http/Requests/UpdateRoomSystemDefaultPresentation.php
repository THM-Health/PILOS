<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomSystemDefaultPresentation extends FormRequest
{
    public function rules()
    {
        return [
            'use_in_meeting' => ['required', 'boolean'],
        ];
    }
}
