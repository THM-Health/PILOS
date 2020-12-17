<?php

namespace App\Http\Requests;

use App\Rules\Password;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $rules = [
            'user_locale'           => ['required', 'string', Rule::in(config('app.available_locales'))],
            'bbb_skip_check_audio'  => 'required|boolean',
            'roles'                 => 'required|array',
            'roles.*'               => 'distinct|exists:App\Role,id'
        ];

        if (!$this->user || $this->user->authenticator === 'users') {
            $rules['firstname'] = 'required|string|max:255';
            $rules['lastname']  = 'required|string|max:255';
            $rules['email']     = ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->where(function ($query) {
                $query = $query->where('authenticator', '=', 'users');

                if ($this->user) {
                    $query = $query->where('id', '!=', $this->user->id);
                }

                return $query;
            })];
            $rules['password']  = [!$this->user ? 'required' : 'nullable', 'string', 'min:8', 'confirmed', new Password()];
        }

        return $rules;
    }
}
