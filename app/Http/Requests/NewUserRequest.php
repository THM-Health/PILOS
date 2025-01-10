<?php

namespace App\Http\Requests;

use App\Models\Role;
use App\Rules\Password;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class NewUserRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $prohibitedRoles = \Auth::user()->superuser ? [] : Role::where(['superuser' => true])->pluck('id')->toArray();

        return [
            'firstname' => ['required', 'string', 'max:255'],
            'lastname' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->where('authenticator', 'local')],
            'user_locale' => ['required', 'string', Rule::in(array_keys(config('app.enabled_locales')))],
            'timezone' => ['required', 'string', Rule::in(timezone_identifiers_list())],
            'roles' => ['required', 'array'],
            'roles.*' => ['distinct', 'integer', 'exists:App\Models\Role,id', Rule::notIn($prohibitedRoles)],
            'generate_password' => ['required', 'boolean'],
            'new_password' => ['required_if:generate_password,false', 'string', 'min:8', 'confirmed', new Password],
        ];
    }
}
