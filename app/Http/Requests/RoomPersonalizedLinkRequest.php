<?php

// SPDX-FileCopyrightText: 2021 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\RoomUserRole;
use App\Rules\ValidName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoomPersonalizedLinkRequest extends FormRequest
{
    public function rules()
    {
        return [
            'firstname' => ['bail', 'required', 'min:2', 'max:50', new ValidName],
            'lastname' => ['bail', 'required', 'min:2', 'max:50', new ValidName],
            'role' => ['required', Rule::in([RoomUserRole::USER, RoomUserRole::MODERATOR])],
        ];
    }
}
