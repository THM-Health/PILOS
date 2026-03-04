<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ServerConnectionCheckRequest extends FormRequest
{
    protected function prepareForValidation()
    {
        if ($this->base_url && ! str_ends_with($this->base_url, '/')) {
            $this->merge(['base_url' => $this->base_url.'/']);
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
