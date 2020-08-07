<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
                'firstname' => 'required|string|max:255',
                'lastname'  => 'required|string|max:255',
                'email'     => 'required|email|max:255|unique:users,email',
                'username'  => 'required|string|max:255|unique:users,username',
                'password'  => 'required|string|max:255'
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
}
