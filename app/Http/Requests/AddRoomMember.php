<?php

namespace App\Http\Requests;

use App\Enums\RoomUserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddRoomMember extends FormRequest
{
    public function rules()
    {
        return [
            'user' => ['required','integer','exists:App\Models\User,id',
                function ($attribute, $value, $fail) {
                    if ($this->room->members()->find($value) or $this->room->owner->id == $value) {
                        $fail(__('validation.custom.room.already_member'));
                    }
                }],
            'role' => ['required',Rule::in([RoomUserRole::USER,RoomUserRole::MODERATOR,RoomUserRole::CO_OWNER])],
        ];
    }
}
