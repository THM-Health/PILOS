<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ServerRequest extends FormRequest
{
    public function rules()
    {
        $rules = [
            'name'          => ['required', 'string', 'max:255', Rule::unique('servers', 'name')],
            'description'   => ['nullable', 'string', 'max:255'],
            'base_url'      => ['required', 'url', 'string', 'max:255', Rule::unique('servers', 'base_url')],
            'salt'          => ['required', 'string', 'max:255'],
            'strength'      => ['required', 'integer','min:1','max:10'],
            'disabled'      => ['required', 'boolean']
        ];

        if ($this->route('server')) {
            $rules['name']       = ['required', 'string', 'max:255', Rule::unique('servers', 'name')->ignore($this->route('server')->id)];
            $rules['base_url']   = ['required', 'url', 'string', 'max:255', Rule::unique('servers', 'base_url')->ignore($this->route('server')->id)];
        }

        return $rules;
    }
}
