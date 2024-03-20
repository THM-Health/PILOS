<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoomTypeRequest extends FormRequest
{
    public function rules()
    {
        $rules = [
            'name' => ['required', 'string', 'max:255', Rule::unique('room_types', 'name')],
            'description' => ['nullable', 'string', 'max:5000'],
            'color' => ['required', 'string', 'hex_color'],
            'allow_listing' => ['required', 'boolean'],
            'max_duration' => ['present', 'nullable', 'numeric', 'min:1'],
            'max_participants' => ['present', 'nullable', 'numeric', 'min:1'],
            'require_access_code' => ['required', 'boolean'],
            'allow_record_attendance' => ['required', 'boolean'],
            'server_pool' => ['required', 'exists:App\Models\ServerPool,id'],
            'restrict' => ['required', 'boolean'],
            'roles' => [Rule::requiredIf($this->boolean('restrict')), 'array'],
            'roles.*' => ['distinct', 'exists:App\Models\Role,id'],
        ];

        if ($this->roomType) {
            $rules['name'] = ['required', 'string', 'max:255', Rule::unique('room_types', 'name')->ignore($this->roomType->id)];
        }

        return $rules;
    }
}
