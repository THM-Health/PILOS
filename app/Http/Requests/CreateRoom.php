<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateRoom extends FormRequest
{
    public function rules()
    {
        return [
            'roomType' => 'required|exists:App\RoomType,id',
            'name'     => 'required|string|max:'.config('bigbluebutton.room_name_limit'),
        ];
    }
}
