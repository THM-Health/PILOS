<?php

declare(strict_types=1);

namespace App\Auth\OIDC;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class OIDCRedirectRequest extends FormRequest
{
    public function rules()
    {
        return [
            'redirect' => ['string'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        abort(400);
    }
}
