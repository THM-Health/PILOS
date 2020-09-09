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
            'name'          => ['required', 'string', 'alpha_dash', 'max:255', Rule::unique('roles', 'name')],
            'room_limit'    => 'nullable|int|min:-1',
            'permissions'   => 'required|array',
            'permissions.*' => 'distinct|exists:App\Permission,id'
        ];

        if ($this->role) {
            $rules['name']       = ['required', 'string', 'alpha_dash', 'max:255', Rule::unique('roles', 'name')->ignore($this->role->id)];
            $rules['updated_at'] = 'required|date';
        }

        return $rules;
    }
}
