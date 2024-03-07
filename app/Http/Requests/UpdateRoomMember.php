<?php

namespace App\Http\Requests;

use App\Enums\RoomUserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoomMember extends FormRequest
{
    public function rules()
    {
        return [
            'role' => ['required', Rule::in([RoomUserRole::USER, RoomUserRole::MODERATOR, RoomUserRole::CO_OWNER])],
        ];
    }
}
