<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLdap extends FormRequest
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
        return [
            'mail'     => 'required|email|max:255',
            'cn'       => 'required|string|max:255',
            'givenname'=> 'required|string|max:255',
            'sn'       => 'required|string|max:255'
        ];
    }
}
