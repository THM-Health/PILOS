<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Http\Requests;

use App\Rules\ValidRoomType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class CreateRoomRequest extends FormRequest
{
    public function rules()
    {
        return [
            'room_type' => ['bail', 'required', 'integer', 'exists:App\Models\RoomType,id', new ValidRoomType(Auth::user())],
            'name' => ['required', 'string', 'min:2', 'max:'.config('bigbluebutton.room_name_limit')],
        ];
    }
}
