<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoomTypeDestroyRequest extends FormRequest
{
    public function rules()
    {
        return [
            'replacement_room_type' => ['nullable',Rule::requiredIf($this->roomType->rooms()->count() > 0),'exists:App\Models\RoomType,id',Rule::notIn([$this->roomType->id])],
        ];
    }
}
