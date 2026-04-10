<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ServerIndexRequest extends FormRequest
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
            'update_usage' => ['boolean'],
            'sort_by' => [Rule::in(['id', 'name', 'version', 'status', 'meeting_count', 'video_count', 'participant_count'])],
            'sort_direction' => [Rule::in(['asc', 'desc'])],
        ];
    }
}
