<?php

namespace App\Http\Requests;

use App\Models\Room;
use App\Models\RoomType;
use App\Rules\ValidRoomType;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomSettings extends FormRequest
{
    public function rules()
    {
        $rules = [
            'access_code' => ['numeric', 'digits:9', 'bail'],
            'room_type' => ['bail', 'required', 'exists:App\Models\RoomType,id', new ValidRoomType($this->room->owner)],
            'name' => ['required', 'string', 'min:2', 'max:'.config('bigbluebutton.room_name_limit')],
            'short_description' => ['nullable', 'string', 'max:300'],
            'expert_mode' => ['required', 'boolean'],
        ];

        // Make sue that the given room type id is a number
        if (is_numeric($this->input('room_type'))) { //ToDo check if is enough to fix problem
            // Check if a room type exists with the given number
            $newRoomType = RoomType::find($this->input('room_type'));
            if ($newRoomType) {
                // Set access code to required if enforced in room type
                if ($newRoomType->has_access_code_enforced && $newRoomType->has_access_code_default) {
                    array_unshift($rules['access_code'], 'required');
                }
                // Set access code to prohibited if enforced in room type
                elseif ($newRoomType->has_access_code_enforced && ! $newRoomType->has_access_code_default) {
                    array_unshift($rules['access_code'], 'prohibited', 'nullable');
                }
                // Set access code to nullable (room can have an access code but access code is not enforced)
                else {
                    array_unshift($rules['access_code'], 'nullable');
                }
            }
        }

        foreach (Room::ROOM_SETTINGS_DEFINITION as $setting => $config) {
            //Expert mode for room is deactivated and setting is an expert setting: do not update setting
            if (! $this->expert_mode && (! isset($config['expert']) || $config['expert'] !== false)) {
                continue;
            }
            $rules[$setting] = Room::getRoomSettingValidationRule($setting);
        }

        if ($this->expert_mode) {
            $rules['welcome'] = ['nullable', 'string', 'max:'.config('bigbluebutton.welcome_message_limit')];
        }

        return $rules;
    }
}
