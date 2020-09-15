<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Lang;

class StoreUser extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        if (in_array($this->method(), ['POST'])) {
            return [
                'firstname'             => 'required|string|max:255',
                'lastname'              => 'required|string|max:255',
                'email'                 => 'required|email|max:255|unique:users,email',
                'username'              => 'required|string|max:255|unique:users,username',
                'password'              => ['required','string', 'confirmed','regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(_|[^\w])).+$/','min:8','max:20'],
                'password_confirmation' => 'required|string|max:255'
            ];
        }

        if (in_array($this->method(), ['PUT', 'PATCH'])) {
            return [
                'firstname' => 'required|string|max:255',
                'lastname'  => 'required|string|max:255',
                'email'     => 'required|email|max:255|unique:users,email,' . $this->user->id,
                'username'  => 'required|string|max:255|unique:users,username,' . $this->user->id
            ];
        }
    }

    public function messages()
    {
        return [
            // Password should have at least 1 lowercase AND 1 uppercase AND 1 number AND 1 symbol
            'password.regex' => Lang::get('validation.custom.user.password')
        ];
    }
}
