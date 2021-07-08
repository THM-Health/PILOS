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
            'accessCode'                     => 'nullable|numeric|digits:9',
            'allowMembership'                => 'required|boolean',
            'everyoneCanStart'               => 'required|boolean',
            'lockSettingsDisableCam'         => 'required|boolean',
            'lockSettingsDisableMic'         => 'required|boolean',
            'lockSettingsDisableNote'        => 'required|boolean',
            'lockSettingsDisablePrivateChat' => 'required|boolean',
            'lockSettingsDisablePublicChat'  => 'required|boolean',
            'lockSettingsLockOnJoin'         => 'required|boolean',
            'lockSettingsHideUserList'       => 'required|boolean',
            'muteOnStart'                    => 'required|boolean',
            'webcamsOnlyForModerator'        => 'required|boolean',
            'defaultRole'                    => ['required',Rule::in([RoomUserRole::USER,RoomUserRole::MODERATOR])],
            'allowGuests'                    => 'required|boolean',
            'lobby'                          => ['required',new EnumValue(RoomLobby::class)],
            'roomType'                       => ['required', 'exists:App\RoomType,id', new ValidRoomType($this->room->owner)],
            'duration'                       => 'nullable|numeric|min:1',
            'maxParticipants'                => 'nullable|numeric|min:1',
            'name'                           => 'required|string|max:'.config('bigbluebutton.room_name_limit'),
            'welcome'                        => 'nullable|string|max:'.config('bigbluebutton.welcome_message_limit'),
            'listed'                         => 'required|boolean',
            'record_attendance'              => 'required|boolean'
        ];
    }
}
