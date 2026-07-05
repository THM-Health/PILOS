<?php

// SPDX-FileCopyrightText: 2021 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ServerPoolRequest extends FormRequest
{
    public function rules()
    {
        $rules = [
            'name' => ['required', 'string', 'max:255', Rule::unique('server_pools', 'name')],
            'description' => ['nullable', 'string', 'max:255'],
            'servers' => 'array',
            'servers.*' => ['distinct', 'integer', 'exists:App\Models\Server,id'],
        ];

        if ($this->serverPool) {
            $rules['name'] = ['required', 'string', 'max:255', Rule::unique('server_pools', 'name')->ignore($this->serverPool->id)];
        }

        return $rules;
    }
}
