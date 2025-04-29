<?php

namespace App\Rules;

use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Contracts\Validation\Rule;

class ValidRoomType implements Rule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct(
        /**
         * @var User The owner of the room.
         */
        private readonly User $owner
    ) {}

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     */
    public function passes($attribute, $value): bool
    {
        if (! is_numeric($value)) {
            return false;
        }

        return Room::roomTypePermitted($this->owner, RoomType::find($value));
    }

    /**
     * Get the validation error message.
     */
    public function message(): string
    {
        return __('validation.custom.invalid_room_type');
    }
}
