<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ChangeEmailRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->where(fn ($query) => $query->where('authenticator', '=', 'local')->where('id', '!=', $this->user->id))],
            'current_password' => $this->user->is(Auth::user()) ? ['required', 'current_password'] : [],
        ];
    }
}
