<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RoleRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name'          => 'required|string|alpha_dash|max:255|unique:App\Role',
            'permissions'   => 'required|array',
            'permissions.*' => 'distinct|exists:App\Permission,id',
        ];
    }
}
