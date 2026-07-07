<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Rules\ValidName;
use Illuminate\Foundation\Http\FormRequest;

class ValidateParticipantNameRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['bail', 'required', 'min:2', 'max:50', new ValidName],
        ];
    }
}
