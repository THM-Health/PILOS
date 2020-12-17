<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ServerConnectionCheckRequest extends FormRequest
{
    public function rules()
    {
        return [
            'base_url'      => ['required', 'active_url', 'string', 'max:255'],
            'salt'          => ['required', 'string', 'max:255'],
        ];
    }
}
