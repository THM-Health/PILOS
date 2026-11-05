<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomSystemDefaultRequest extends FormRequest
{
    public function rules()
    {
        return [
            'prefer_as_start' => ['sometimes', 'required', 'boolean', 'accepted'],
        ];
    }
}
