<?php

namespace App\Http\Requests;

use App\Enums\RoomUserRole;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkUpdateRequest extends FormRequest
{
    public function rules()
    {
        return [
            'role' => ['required', Rule::in([RoomUserRole::USER, RoomUserRole::MODERATOR, RoomUserRole::CO_OWNER])],
            'users' => ['required', 'array'],
            'users.*' => ['required', 'integer', 'distinct', 'exists:App\Models\User,id',
                function ($attribute, $value, $fail) {
                    $user = User::find($value);
                    if (! $this->room->members()->find($value) or $this->room->owner->is($user)) {
                        $fail(__('validation.custom.room.not_member', ['firstname' => $user->firstname, 'lastname' => $user->lastname]));
                    }
                    if ($user->is(\Auth::user())) {
                        $fail(__('validation.custom.room.self_edit'));
                    }
                }],
        ];
    }
}
