<?php

namespace App\Http\Requests;

use App\Models\Room;
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
            'max_duration' => ['present', 'nullable', 'numeric', 'min:1'],
            'max_participants' => ['present', 'nullable', 'numeric', 'min:1'],
            'server_pool' => ['required', 'integer', 'exists:App\Models\ServerPool,id'],
            'create_meeting_plugin_config' => ['nullable', 'string', 'json', 'max:65000'],
            'join_meeting_plugin_config' => ['nullable', 'string', 'json', 'max:65000'],
            'restrict' => ['required', 'boolean'],
            'roles' => [Rule::requiredIf($this->boolean('restrict')), 'array'],
            'roles.*' => ['distinct', 'integer', 'exists:App\Models\Role,id'],
            // Default room settings
            'has_access_code_default' => ['required', 'boolean'],
            'has_access_code_enforced' => ['required', 'boolean'],
        ];

        // Default room settings
        foreach (Room::ROOM_SETTINGS_DEFINITION as $setting => $config) {
            $rules[$setting.'_default'] = Room::getRoomSettingValidationRule($setting);
            $rules[$setting.'_enforced'] = ['required', 'boolean'];
        }

        if ($this->roomType) {
            $rules['name'] = ['required', 'string', 'max:255', Rule::unique('room_types', 'name')->ignore($this->roomType->id)];
        }

        return $rules;
    }
}
