<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\RoomUserRole;
use App\Rules\ValidName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoomPersonalizedLinkRequest extends FormRequest
{
    public function rules()
    {
        return [
            'description' => ['bail', 'required', 'min:2', 'max:50'],
            'enforced_name' => ['bail', 'nullable', 'min:2', 'max:50', new ValidName],
            'role' => ['required', Rule::in([RoomUserRole::USER, RoomUserRole::MODERATOR])],
        ];
    }
}
