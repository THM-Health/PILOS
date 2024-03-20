<?php

namespace App\Http\Requests;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
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

            'webcams_only_for_moderator_default' => ['required', 'boolean'],
            'webcams_only_for_moderator_enforced' => ['required', 'boolean'],
            'mute_on_start_default' => ['required', 'boolean'],
            'mute_on_start_enforced' => ['required', 'boolean'],
            'lock_settings_disable_cam_default' => ['required', 'boolean'],
            'lock_settings_disable_cam_enforced' => ['required', 'boolean'],
            'lock_settings_disable_mic_default' => ['required', 'boolean'],
            'lock_settings_disable_mic_enforced' => ['required', 'boolean'],
            'lock_settings_disable_private_chat_default' => ['required', 'boolean'],
            'lock_settings_disable_private_chat_enforced' => ['required', 'boolean'],
            'lock_settings_disable_public_chat_default' => ['required', 'boolean'],
            'lock_settings_disable_public_chat_enforced' => ['required', 'boolean'],
            'lock_settings_disable_note_default' => ['required', 'boolean'],
            'lock_settings_disable_note_enforced' => ['required', 'boolean'],
            'lock_settings_hide_user_list_default' => ['required', 'boolean'],
            'lock_settings_hide_user_list_enforced' => ['required', 'boolean'],
            'everyone_can_start_default' => ['required', 'boolean'],
            'everyone_can_start_enforced' => ['required', 'boolean'],
            'allow_guests_default' => ['required', 'boolean'],
            'allow_guests_enforced' => ['required', 'boolean'],
            'allow_membership_default' => ['required', 'boolean'],
            'allow_membership_enforced' => ['required', 'boolean'],
            'default_role_default' => ['required', Rule::in([RoomUserRole::USER, RoomUserRole::MODERATOR, RoomUserRole::CO_OWNER])],
            'default_role_enforced' => ['required', 'boolean'],
            'lobby_default' => ['required', Rule::in([RoomLobby::DISABLED, RoomLobby::ENABLED, RoomLobby::ONLY_GUEST])],
            'lobby_enforced' => ['required', 'boolean'],
        ];

        if ($this->roomType) {
            $rules['name'] = ['required', 'string', 'max:255', Rule::unique('room_types', 'name')->ignore($this->roomType->id)];
        }

        return $rules;
    }
}
