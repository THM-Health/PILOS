<?php

namespace App\Http\Requests;

use App\Models\Room;
use App\Rules\ValidRoomType;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomSettings extends FormRequest
{
    public function rules()
    {
        $rules = [
            'access_code' => ['nullable', 'numeric', 'digits:9'],
            'room_type' => ['bail', 'required', 'exists:App\Models\RoomType,id', new ValidRoomType($this->room->owner)],
            'name' => ['required', 'string', 'min:2', 'max:'.config('bigbluebutton.room_name_limit')],
            'short_description' => 'nullable', 'string', 'max:300',
            'expert_mode' => ['required', 'boolean'],
        ];

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
