<?php

namespace App\Http\Requests;

use App\Enums\RoomAuthTokenType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoomAuthRequest extends FormRequest
{
    public function rules()
    {
        return [
            'type' => ['required', Rule::enum(RoomAuthTokenType::class)],
            'access_code' => ['required_if:type,'.RoomAuthTokenType::CODE->value],
            'access_token' => ['required_if:type,'.RoomAuthTokenType::TOKEN->value],
        ];
    }

    public function messages()
    {
        // ToDo Adjust error message
        return [
            'access_code.required_if' => __('validation.custom.streaming_pause_image_file.dimensions'),
        ];
    }
}
