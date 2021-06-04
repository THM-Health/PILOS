<?php

namespace App\Http\Requests;

use App\Enums\RoomUserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoomTokenRequest extends FormRequest
{
    public function rules()
    {
        return [
            'firstname' => 'required|string|max:255',
            'lastname'  => 'required|string|max:255',
            'role'      => ['required', Rule::in([RoomUserRole::USER, RoomUserRole::MODERATOR])],
        ];
    }
}
