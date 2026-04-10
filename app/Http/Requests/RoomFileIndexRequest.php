<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoomFileIndexRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'query' => ['nullable', 'string'],
            'filter' => [Rule::in(['use_in_meeting', 'downloadable'])],
            'sort_by' => [Rule::in(['filename', 'uploaded'])],
            'sort_direction' => [Rule::in(['asc', 'desc'])],
        ];
    }
}
