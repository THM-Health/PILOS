<?php

namespace App\Http\Requests;

use App\User;
use Illuminate\Foundation\Http\FormRequest;

class MassDeleteRequest extends FormRequest
{
    public function rules()
    {
        return [
            'users'   => ['required','array'],
            'users.*' => ['required','integer','exists:App\User,id',
            function ($attribute, $value, $fail) {
                $user = User::find($value);
                if (!$this->room->members()->find($value) or $this->room->owner->is($user)) {
                    $fail(__('validation.custom.room.not_member', ['firstname' => $user->firstname, 'lastname' => $user->lastname] ));
                }
                if ($user->is(\Auth::user())) {
                    $fail(__('validation.custom.room.self_delete'));
                }
            }],
        ];
    }
}
