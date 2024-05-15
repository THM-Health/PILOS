<?php

namespace App\Http\Requests;

use App\Rules\ValidRoomType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class CreateRoom extends FormRequest
{
    public function rules()
    {
        return [
            'room_type' => ['bail', 'required', 'integer', 'exists:App\Models\RoomType,id', new ValidRoomType(Auth::user())],
            'name' => 'required|string|min:2|max:'.config('bigbluebutton.room_name_limit'),
        ];
    }
}
