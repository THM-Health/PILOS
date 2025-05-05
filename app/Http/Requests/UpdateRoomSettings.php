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
            'access_code' => $this->getAccessCodeValidationRule(),
            'room_type' => ['bail', 'required', 'integer', 'exists:App\Models\RoomType,id', new ValidRoomType($this->room->owner)],
            'name' => ['required', 'string', 'min:2', 'max:'.config('bigbluebutton.room_name_limit')],
            'short_description' => ['nullable', 'string', 'max:300'],
            'expert_mode' => ['required', 'boolean'],
            'dialin_pin' => $this->getDialinPinValidationRule(),
        ];

        // Generate validation rules for all visible room settings
        foreach (Room::ROOM_SETTINGS_DEFINITION as $setting => $config) {
            // Expert mode for room is deactivated and setting is an expert setting: do not update setting
            if (! $this->expert_mode && $config['expert']) {
                continue;
            }
            $rules[$setting] = Room::getRoomSettingValidationRule($setting);
        }

        if ($this->expert_mode) {
            $rules['welcome'] = ['nullable', 'string', 'max:'.config('bigbluebutton.welcome_message_limit')];
        }

        return $rules;
    }

    /**
     * Set access code validation rule based on the settings in the room type
     *
     * @return string[] access code validation rules
     */
    private function getAccessCodeValidationRule(): array
    {
        $rules = ['numeric', 'digits:9', 'bail'];

        // Make sure that the given room type id is a number
        if (is_numeric($this->input('room_type'))) {
            // Check if a room type exists with the given number
            $newRoomType = RoomType::find($this->input('room_type'));
            if ($newRoomType) {
                // Set access code to required if enforced in room type
                if ($newRoomType->has_access_code_enforced && $newRoomType->has_access_code_default) {
                    array_unshift($rules, 'required');
                }
                // Set access code to prohibited if enforced in room type
                elseif ($newRoomType->has_access_code_enforced && ! $newRoomType->has_access_code_default) {
                    array_unshift($rules, 'prohibited', 'nullable');
                }
                // Set access code to nullable (room can have an access code but access code is not enforced)
                else {
                    array_unshift($rules, 'nullable');
                }
            }
        }

        return $rules;
    }

    /**
     * Set dialin_pin validation rule based on the settings in the room type
     *
     * @return string[] dialin_pin validation rules
     */
    private function getDialinPinValidationRule(): array
    {
        $rules = ['integer', 'digits:5', 'bail', 'min:10000', 'max:99999', 'unique:rooms,dialin_pin,' . $this->room->id];

        // Make sure that the given room type id is a number
        if (is_numeric($this->input('room_type'))) {
            // Check if a room type exists with the given number
            $newRoomType = RoomType::find($this->input('room_type'));
            if ($newRoomType) {
                // Set dialin_pin to required if enforced in room type
                if ($newRoomType->has_dialin_pin_enforced && $newRoomType->has_dialin_pin_default) {
                    array_unshift($rules, 'required');
                }
                // Set dialin_pin to prohibited if enforced in room type
                elseif ($newRoomType->has_dialin_pin_enforced && ! $newRoomType->has_dialin_pin_default) {
                    array_unshift($rules, 'prohibited', 'nullable');
                }
                // Set dialin_pin to nullable (room can have an dialin_pin but dialin_pin is not enforced)
                else {
                    array_unshift($rules, 'nullable');
                }
            }
        }

        return $rules;
    }
}
