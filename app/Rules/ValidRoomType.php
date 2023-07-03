<?php

namespace App\Rules;

use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Contracts\Validation\Rule;

class ValidRoomType implements Rule
{
    /**
     * @var User $owner The owner of the room.
     */
    private User $owner;

    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct(User $owner)
    {
        $this->owner = $owner;
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value): bool
    {
        if (!is_numeric($value)) {
            return false;
        }

        return Room::roomTypePermitted($this->owner, RoomType::find($value));
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message(): string
    {
        return __('validation.custom.invalid_room_type');
    }
}
