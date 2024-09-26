<?php

namespace App\Http\Requests;

use App\Enums\RoomUserRole;
use App\Rules\ValidName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoomTokenRequest extends FormRequest
{
    public function rules()
    {
        return [
            'firstname' => ['required', 'min:2', 'max:50',  new ValidName],
            'lastname' => ['required', 'min:2', 'max:50',  new ValidName],
            'role' => ['required', Rule::in([RoomUserRole::USER, RoomUserRole::MODERATOR])],
        ];
    }
}
