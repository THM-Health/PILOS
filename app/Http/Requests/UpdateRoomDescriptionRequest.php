<?php

// SPDX-FileCopyrightText: 2023 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomDescriptionRequest extends FormRequest
{
    public function rules()
    {
        return [
            'description' => ['nullable', 'string', 'max:65000'],
        ];
    }
}
