<?php

declare(strict_types=1);

namespace App\Http\Requests\External;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RoomTypeIndexRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'filter' => ['nullable', 'string', 'in:own'],
        ];
    }
}
