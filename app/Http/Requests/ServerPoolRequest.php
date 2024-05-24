<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ServerPoolRequest extends FormRequest
{
    public function rules()
    {
        $rules = [
            'name' => ['required', 'string', 'max:255', Rule::unique('server_pools', 'name')],
            'description' => ['nullable', 'string', 'max:255'],
            'servers' => 'array',
            'servers.*' => ['distinct', 'integer', 'exists:App\Models\Server,id'],
        ];

        if ($this->serverPool) {
            $rules['name'] = ['required', 'string', 'max:255', Rule::unique('server_pools', 'name')->ignore($this->serverPool->id)];
        }

        return $rules;
    }
}
