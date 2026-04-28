<?php

declare(strict_types=1);

namespace App\Auth\OIDC;

use App\Prometheus\Counter;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;

class OIDCCallbackRequest extends FormRequest
{
    public function rules()
    {
        return [
            'code' => ['string'],
            'state' => ['string'],
            'error' => ['string'],
            'error_description' => ['string'],
        ];
    }

    protected $redirect = '/external_login?error=invalid_request';

    protected function failedValidation(Validator $validator): void
    {
        $keys = $validator->errors()->keys();
        $message = 'invalid request parameter(s): '.implode(',', $keys);

        Counter::get('login_failed_total')->inc('oidc');
        Log::error('OIDC login callback failed: '.$message);

        parent::failedValidation($validator);
    }
}
