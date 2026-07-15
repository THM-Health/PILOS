<?php

declare(strict_types=1);

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
            // Backup servers are optional
            // but if provided, they must be distinct and exist in the database
            'backup_servers' => 'array',
            'servers.*' => ['distinct', 'integer', 'exists:App\Models\Server,id'],
            'backup_servers.*' => ['distinct', 'integer', 'exists:App\Models\Server,id'],
        ];

        if ($this->serverPool) {
            $rules['name'] = ['required', 'string', 'max:255', Rule::unique('server_pools', 'name')->ignore($this->serverPool->id)];

        }

        return $rules;
    }
}
