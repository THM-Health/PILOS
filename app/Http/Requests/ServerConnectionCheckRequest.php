<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ServerConnectionCheckRequest extends FormRequest
{
    public function rules()
    {
        return [
            'base_url' => ['required', 'url', 'string', 'max:255'],
            'secret' => ['required', 'string', 'max:255'],
        ];
    }
}
