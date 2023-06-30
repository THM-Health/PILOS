<?php

namespace App\Http\Requests;

use App\Enums\RoomUserRole;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ShowRoomsRequest extends FormRequest
{
    public function rules()
    {
        return[
            'filter'          => ['required', 'string'],
            'selected_room_type'=>['required','integer'],
            'selected_sorting_type' =>['required','string'],
            'search' =>['string'],
            'page'=>[]
            ];
    }
}
