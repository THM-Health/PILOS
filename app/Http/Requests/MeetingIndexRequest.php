<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MeetingIndexRequest extends FormRequest
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
            'sort_by' => [Rule::in(['start', 'room.participant_count', 'room.listener_count', 'room.voice_participant_count', 'room.video_count'])],
            'sort_direction' => [Rule::in(['asc', 'desc'])],
        ];
    }
}
