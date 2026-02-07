<?php

namespace App\Http\Requests;

use App\Enums\RoomUserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddRoomRoleMember extends FormRequest
{
    public function rules()
    {
        return [
            'role_id' => ['required', 'integer', 'exists:App\Models\Role,id',
                function ($attribute, $value, $fail) {
                    if ($this->room->roleMembers()->where('role_id', $value)->exists()) {
                        $fail(__('validation.custom.room.role_already_member'));
                    }
                }],
            'role' => ['required', Rule::in([RoomUserRole::USER, RoomUserRole::MODERATOR, RoomUserRole::CO_OWNER])],
        ];
    }
}
