<?php

// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Auth\Shibboleth;

use App\Prometheus\Counter;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;

class ShibbolethCallbackRequest extends FormRequest
{
    public function rules()
    {
        return [
            'redirect' => ['string'],
        ];
    }

    protected $redirect = '/external_login?error=invalid_request';

    protected function failedValidation(Validator $validator): void
    {
        $keys = $validator->errors()->keys();
        $message = 'invalid request parameter(s): '.implode(',', $keys);

        Counter::get('login_failed_total')->inc('shibboleth');
        Log::error('Shibboleth login callback failed: '.$message);

        parent::failedValidation($validator);
    }
}
