<?php

namespace App\Http\Requests;

use App\Enums\RoomLobby;
use App\Enums\RoomUserRole;
use BenSampo\Enum\Rules\EnumValue;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoomSettings extends FormRequest
{
    public function rules()
    {
        return [
            'accessCode'                     => 'nullable|numeric|digits:9',
            'allowSubscription'              => 'required|boolean',
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
            'duration'                       => 'nullable|numeric',
            'maxParticipants'                => 'nullable|numeric',
            'name'                           => 'required|string',
            'welcome'                        => 'nullable|string',
        ];
    }

    public function authorize()
    {
        return true;
    }
}
