<?php

namespace App\Http\Requests;

use App\Rules\Color;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoomTypeRequest extends FormRequest
{
    public function rules()
    {
        $rules = [
            'description'   => ['required', 'string', 'max:255', Rule::unique('room_types', 'description')],
            'short'         => ['required', 'string', 'max:2', Rule::unique('room_types', 'short')],
            'color'         => ['required', 'string', new Color()],
            'allow_listing' => ['required', 'boolean'],
            'server_pool'   => 'required|exists:App\ServerPool,id',
            'restrict'      => ['required', 'boolean'],
            'roles'         => [Rule::requiredIf($this->boolean('restrict')), 'array'],
            'roles.*'       => 'distinct|exists:App\Role,id'
        ];

        if ($this->roomType) {
            $rules['description']   = ['required', 'string', 'max:255', Rule::unique('room_types', 'description')->ignore($this->roomType->id)];
            $rules['short']         = ['required', 'string', 'max:2', Rule::unique('room_types', 'short')->ignore($this->roomType->id)];
        }

        return $rules;
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array
     */
    public function attributes()
    {
        return [
            'short' => __('validation.attributes.icon_text'),
        ];
    }
}
