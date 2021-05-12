<?php

namespace App\Rules;

use App\Room;
use App\RoomType;
use App\User;
use Illuminate\Contracts\Validation\Rule;

class ValidRoomType implements Rule
{
    /**
     * @var User $owner The owner of the room type.
     */
    private $owner;

    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct($owner)
    {
        $this->owner = $owner;
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value): bool
    {
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
