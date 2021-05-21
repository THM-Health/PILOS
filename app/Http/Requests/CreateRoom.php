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
            'roomType' => ['required', 'exists:App\RoomType,id', new ValidRoomType(Auth::user())],
            'name'     => 'required|string|max:'.config('bigbluebutton.room_name_limit'),
        ];
    }
}
