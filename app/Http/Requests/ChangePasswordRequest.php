<?php

namespace App\Http\Requests;

use App\Rules\Password;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class ChangePasswordRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'new_password'     => [ 'required', 'string', 'min:8', 'confirmed', new Password()],
            'current_password' => $this->user->is(Auth::user()) ? 'required|current_password' : ''
        ];
    }
}
