<?php

namespace App\Http\Requests;

use App\Enums\RoomUserRole;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Room;

class TransferOwnershipRequest extends FormRequest
{
    public function rules()
    {
        return [
            'user' => ['bail','required','integer','exists:App\Models\User,id',
                function ($attribute, $value, $fail) {
                    $user = User::find($value);
                    if ($this->room->owner->is($user)) {
                        $fail(__('validation.custom.room.is_owner'));
                    }
                    if($user->cannot('create', Room::class)){
                        $fail(__('validation.can_not_own_rooms'));
                    }
                    if(!Room::roomTypePermitted($user, $this->room->roomType)){
                        $fail(__('validation.custom.invalid_room_type'));
                    }

                    if ($user->hasRoomLimitExceeded()) {
                        $fail(__('app.errors.room_limit_exceeded'));
                    }
                }],
            'role' => [Rule::in([RoomUserRole::USER,RoomUserRole::MODERATOR,RoomUserRole::CO_OWNER])],
        ];
    }
}
