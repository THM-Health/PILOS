<?php

namespace App\Http\Requests;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Rules\ValidRoomType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoomSettings extends FormRequest
{
    public function rules()
    {
        return [
            'access_code' => 'nullable|numeric|digits:9',
            'allow_membership' => 'required|boolean',
            'everyone_can_start' => 'required|boolean',
            'lock_settings_disable_cam' => 'required|boolean',
            'lock_settings_disable_mic' => 'required|boolean',
            'lock_settings_disable_note' => 'required|boolean',
            'lock_settings_disable_private_chat' => 'required|boolean',
            'lock_settings_disable_public_chat' => 'required|boolean',
            'lock_settings_hide_user_list' => 'required|boolean',
            'mute_on_start' => 'required|boolean',
            'webcams_only_for_moderator' => 'required|boolean',
            'default_role' => ['required', Rule::in([RoomUserRole::USER, RoomUserRole::MODERATOR])],
            'allow_guests' => 'required|boolean',
            'lobby' => ['required', Rule::enum(RoomLobby::class)],
            'room_type' => ['bail', 'required', 'exists:App\Models\RoomType,id', new ValidRoomType($this->room->owner)],
            'name' => 'required|string|min:2|max:'.config('bigbluebutton.room_name_limit'),
            'welcome' => 'nullable|string|max:'.config('bigbluebutton.welcome_message_limit'),
            'short_description' => 'nullable|string|max:300',
            'listed' => 'required|boolean',
            'record_attendance' => 'required|boolean',
        ];
    }
}
