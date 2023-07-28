<?php

namespace App\Http\Requests;

use App\Enums\RecordingAccess;
use BenSampo\Enum\Rules\EnumValue;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRecordingRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'description' => ['nullable','string'],
            'access' => ['required',new EnumValue(RecordingAccess::class)],
            'formats' => ['required','array'],
            'formats.*.id' => ['required','distinct', Rule::in($this->recording->formats->pluck('id')->toArray())],
            'formats.*.disabled' => ['required','boolean'],
        ];
    }
}
