<?php

// SPDX-FileCopyrightText: 2022 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class BulkDestroyRequest extends FormRequest
{
    public function rules()
    {
        return [
            'users' => ['required', 'array'],
            'users.*' => ['bail', 'required', 'integer', 'distinct', 'exists:App\Models\User,id',
                function ($attribute, $value, $fail) {
                    $user = User::find($value);
                    if (! $this->room->members()->find($value) or $this->room->owner->is($user)) {
                        $fail(__('validation.custom.room.not_member', ['firstname' => $user->firstname, 'lastname' => $user->lastname]));
                    }
                    if ($user->is(Auth::user())) {
                        $fail(__('validation.custom.room.self_delete'));
                    }
                }],
        ];
    }
}
