<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ServerRequest extends FormRequest
{
    public function rules()
    {
        $rules = [
            'description'   => ['required', 'string', 'max:255'],
            'base_url'         => ['required', 'string', 'max:255', Rule::unique('servers', 'baseUrl')],
            'salt'         => ['required', 'string', 'max:255'],
            'strength'         => ['required', 'integer','min:1','max:100'],
            'status'         => ['required', 'boolean']
        ];

        if ($this->server) {
            $rules['base_url']   = ['required', 'string', 'max:255', Rule::unique('servers', 'baseUrl')->ignore($this->server->id)];
        }

        return $rules;
    }
}
