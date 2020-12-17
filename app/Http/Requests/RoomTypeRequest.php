<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoomTypeRequest extends FormRequest
{
    public function rules()
    {
        $rules = [
            'description'   => ['required', 'string', 'max:255', Rule::unique('room_types', 'description')],
            'short'         => ['required', 'string', 'max:2', Rule::unique('room_types', 'short')],
            'color'         => ['required', 'string','regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/']
        ];

        if ($this->roomType) {
            $rules['description']   = ['required', 'string', 'max:255', Rule::unique('room_types', 'description')->ignore($this->roomType->id)];
            $rules['short']         = ['required', 'string', 'max:2', Rule::unique('room_types', 'short')->ignore($this->roomType->id)];
        }

        return $rules;
    }
}
