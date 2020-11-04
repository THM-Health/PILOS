<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoomTypeDestroyRequest extends FormRequest
{
    public function rules()
    {
        return [
            'replacement_room_type' => ['nullable',Rule::requiredIf($this->room_type->rooms()->count() > 0),'exists:App\RoomType,id',Rule::notIn([$this->room_type->id])],
        ];
    }
}
