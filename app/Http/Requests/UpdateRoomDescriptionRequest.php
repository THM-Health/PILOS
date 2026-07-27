<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomDescriptionRequest extends FormRequest
{
    public function rules()
    {
        return [
            'description' => ['nullable', 'string', 'max:65000'],
        ];
    }
}
