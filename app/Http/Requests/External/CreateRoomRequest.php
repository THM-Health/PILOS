<?php

declare(strict_types=1);

namespace App\Http\Requests\External;

use App\Models\Room;
use App\Models\RoomType;
use App\Rules\ValidRoomType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class CreateRoomRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'min:2', 'max:'.config('bigbluebutton.room_name_limit')],
            'room_type' => ['bail', 'required', 'integer', 'exists:App\Models\RoomType,id', new ValidRoomType(Auth::user())],
            'access_code' => $this->getAccessCodeValidationRule(),
            'allow_guests' => $this->getRoomSettingValidationRule('allow_guests'),
        ];

        return $rules;
    }

    private function getAccessCodeValidationRule(): array
    {
        $rules = ['string', 'numeric', 'digits:9', 'bail'];

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

    private function getRoomSettingValidationRule(string $settingName): array
    {
        if (is_numeric($this->input('room_type'))) {
            $newRoomType = RoomType::find($this->input('room_type'));
            if ($newRoomType) {
                return Room::getRoomSettingValidationRule($settingName, $newRoomType);
            }
        }

        return Room::getRoomSettingValidationRule($settingName);
    }
}
