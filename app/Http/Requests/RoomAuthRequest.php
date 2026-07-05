<?php

// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

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
            'personalized_link_token' => ['required_if:type,'.RoomAuthTokenType::PERSONALIZED_LINK->value],
        ];
    }

    public function messages()
    {
        return [
            'access_code.required_if' => __('validation.required', ['attribute' => __('validation.attributes.access_code')]),
        ];
    }
}
