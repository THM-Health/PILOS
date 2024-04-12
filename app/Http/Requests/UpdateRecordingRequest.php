<?php

namespace App\Http\Requests;

use App\Enums\RecordingAccess;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRecordingRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'description' => ['required', 'string'],
            'access' => ['required', Rule::enum(RecordingAccess::class)],
            'formats' => ['required', 'array'],
            'formats.*.id' => ['required', 'distinct', Rule::in($this->recording->formats->pluck('id')->toArray())],
            'formats.*.disabled' => ['required', 'boolean'],
        ];
    }
}
