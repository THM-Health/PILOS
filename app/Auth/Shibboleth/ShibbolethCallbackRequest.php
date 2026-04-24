<?php

declare(strict_types=1);

namespace App\Auth\Shibboleth;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class ShibbolethCallbackRequest extends FormRequest
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
