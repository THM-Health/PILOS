<?php

namespace App\Http\Requests;

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
            'user_locale'           => ['sometimes','required', 'string', Rule::in(config('app.enabled_locales'))],
            'bbb_skip_check_audio'  => ['sometimes','required','boolean'],
            'timezone'              => ['sometimes','required', 'string', Rule::in(timezone_identifiers_list())],
            'roles'                 => ['sometimes','required','array'],
            'roles.*'               => ['sometimes','distinct','exists:App\Models\Role,id'],
            'image'                 => ['sometimes','nullable','mimes:jpg','dimensions:width=100,height=100'],
        ];

        if (!$this->user || $this->user->authenticator === 'local') {
            $rules['firstname'] = ['sometimes','required','string','max:255'];
            $rules['lastname']  = ['sometimes','required','string','max:255'];
            $rules['email']     = ['sometimes','required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->where(function ($query) {
                $query          = $query->where('authenticator', '=', 'local');

                if ($this->user) {
                    $query = $query->where('id', '!=', $this->user->id);
                }

                return $query;
            })];
        }

        return $rules;
    }
}
