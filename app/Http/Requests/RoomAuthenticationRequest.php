<?php

namespace App\Http\Requests;

use App\Enums\RoomGuestAuthenticationTokenType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoomAuthenticationRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(RoomGuestAuthenticationTokenType::class)],
            'code' => ['required_if:type,'.RoomGuestAuthenticationTokenType::CODE->value],
            'token' => ['required_if:type,'.RoomGuestAuthenticationTokenType::TOKEN->value],
        ];
    }
}
