<?php

namespace App\Http\Requests;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use App\Rules\ValidRoomType;
use BenSampo\Enum\Rules\EnumValue;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoomSettings extends FormRequest
{
    public function rules()
    {
        return [
            'access_code'                        => 'nullable|numeric|digits:9',
            'allow_membership'                   => 'required|boolean',
            'everyone_can_start'                 => 'required|boolean',
            'lock_settings_disable_cam'          => 'required|boolean',
            'lock_settings_disable_mic'          => 'required|boolean',
            'lock_settings_disable_note'         => 'required|boolean',
            'lock_settings_disable_private_chat' => 'required|boolean',
            'lock_settings_disable_public_chat'  => 'required|boolean',
            'lock_settings_lock_on_join'         => 'required|boolean',
            'lock_settings_hide_user_list'       => 'required|boolean',
            'mute_on_start'                      => 'required|boolean',
            'webcams_only_for_moderator'         => 'required|boolean',
            'default_role'                       => ['required',Rule::in([RoomUserRole::USER,RoomUserRole::MODERATOR])],
            'allow_guests'                       => 'required|boolean',
            'lobby'                              => ['required',new EnumValue(RoomLobby::class)],
            'room_type'                          => ['required', 'exists:App\RoomType,id', new ValidRoomType($this->room->owner)],
            'duration'                           => 'nullable|numeric|min:1',
            'max_participants'                   => 'nullable|numeric|min:1',
            'name'                               => 'required|string|min:2|max:'.config('bigbluebutton.room_name_limit'),
            'welcome'                            => 'nullable|string|max:'.config('bigbluebutton.welcome_message_limit'),
            'listed'                             => 'required|boolean',
            'record_attendance'                  => 'required|boolean'
        ];
    }
}
