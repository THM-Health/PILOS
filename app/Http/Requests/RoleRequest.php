<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoleRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $rules = [
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')],
            'room_limit' => ['nullable', 'integer', 'min:-1'],
            'permissions' => ['present', 'array'],
            'permissions.*' => ['distinct', 'integer', 'exists:App\Models\Permission,id'],
        ];

        if ($this->role) {
            $rules['name'] = ['required', 'string', 'max:255', Rule::unique('roles', 'name')->ignore($this->role->id)];
            $rules['updated_at'] = ['required', 'date'];
        }

        return $rules;
    }
}
