<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordingIndexRequest extends FormRequest
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
            'filter' => [Rule::in(['everyone_access', 'participant_access', 'moderator_access', 'owner_access'])],
            'sort_by' => [Rule::in(['description', 'start'])],
            'sort_direction' => [Rule::in(['asc', 'desc'])],
        ];
    }
}
