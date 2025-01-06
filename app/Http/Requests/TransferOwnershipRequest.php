<?php

namespace App\Http\Requests;

use App\Enums\RoomUserRole;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransferOwnershipRequest extends FormRequest
{
    public function rules()
    {
        return [
            'user' => ['bail', 'required', 'integer', 'exists:App\Models\User,id',
                function ($attribute, $value, $fail) {
                    $user = User::find($value);
                    // make sure that the given user is not the current owner of the room
                    if ($this->room->owner->is($user)) {
                        $fail(__('validation.custom.transfer_ownership.is_owner'));
                    }
                    // make sure that the given user can create/own rooms
                    if ($user->cannot('create', Room::class)) {
                        $fail(__('validation.custom.transfer_ownership.can_not_own_rooms'));
                    }
                    // make sure that the given user can own rooms with the room type of the given room
                    if (! Room::roomTypePermitted($user, $this->room->roomType)) {
                        $fail(__('validation.custom.transfer_ownership.invalid_room_type'));
                    }
                    // make sure that the given user has not reached the max. amount of rooms
                    if ($user->hasRoomLimitExceeded()) {
                        $fail(__('validation.custom.transfer_ownership.room_limit_exceeded'));
                    }
                }],
            'role' => [Rule::in([RoomUserRole::USER, RoomUserRole::MODERATOR, RoomUserRole::CO_OWNER])],
        ];
    }
}
