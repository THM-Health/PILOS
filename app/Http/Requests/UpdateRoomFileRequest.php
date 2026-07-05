<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomFileRequest extends FormRequest
{
    public function rules()
    {
        return [
            'use_in_meeting' => ['required', 'boolean'],
            'download' => ['required', 'boolean'],
            'default' => ['required', 'boolean'],
        ];
    }
}
