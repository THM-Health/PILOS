<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StartJoinMeeting extends FormRequest
{
    public function rules()
    {
        return [
            'name' => auth()->check() ? '' : 'required|min:2|regex:/^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.\'-]+$/u|max:50',
        ];
    }
}
