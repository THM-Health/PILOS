<?php

namespace App\Http\Requests;

use App\Enums\RoomUserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MassUpdateRequest extends FormRequest
{
    public function rules()
    {
        return [
            'role'    => ['required',Rule::in([RoomUserRole::USER,RoomUserRole::MODERATOR,RoomUserRole::CO_OWNER])],
            'users'   => ['required|array'],
            'users.*' => ['required','integer','exists:App\User,id',
            function ($attribute, $value, $fail) {
                if (!$this->room->members()->find($value) or $this->room->owner->id == $value) {
                    $fail(__('validation.custom.room.not_member'));
                }
                if ($value === \Auth::user()->id) {
                    $fail(__('validation.custom.room.self_edit'));
                }
            }],
        ];
    }
}
