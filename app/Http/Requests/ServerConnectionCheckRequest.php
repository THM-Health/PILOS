<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class ServerConnectionCheckRequest extends FormRequest
{
    protected function prepareForValidation()
    {
        if ($this->base_url) {
            $this->merge(['base_url' => Str::finish($this->base_url, '/')]);
        }
    }

    public function rules()
    {
        return [
            'base_url' => ['required', 'url', 'string', 'max:255'],
            'secret' => ['required', 'string', 'max:255'],
        ];
    }
}
