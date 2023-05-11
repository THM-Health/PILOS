<?php

namespace App\Http\Requests;

use App\Enums\RoomUserRole;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkImportRequest extends FormRequest
{
    public function rules()
    {
        return[
            'role'          => ['required',Rule::in([RoomUserRole::USER,RoomUserRole::MODERATOR,RoomUserRole::CO_OWNER])],
            'user_emails'   => ['required','array','max:1000'],
            'user_emails.*' => ['bail','required','email','distinct:ignore_case',
                function ($attribute, $value, $fail) {
                    $users = User::where('email', $value);
                    if ($users->count() == 0) {
                        $fail(__('validation.custom.room.user_not_found_email'));

                        return;
                    }
                    if ($users->count() > 1) {
                        $fail(__('validation.custom.room.several_users_found_email'));

                        return;
                    }
                    $user = $users->first();

                    if ($this->room->members()->find($user->id) or $this->room->owner->is($user)) {
                        $fail(__('validation.custom.room.already_member'));
                    }
                }]
            ];
    }
    public function attributes()
    {
        return ["user_emails" => __('validation.attributes.user_emails')];
    }
    public function messages()
    {
        return [
            "user_emails.*.email" => __('validation.email',["attribute" => __('app.entry')]),
            "user_email.*.distinct" => __('validation.distinct',["attribute" => __('app.entry')])
            ];
    }
}
