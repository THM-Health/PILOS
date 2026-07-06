<?php

// SPDX-FileCopyrightText: 2021 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Rules;

use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidRoomType implements ValidationRule
{
    /**
     * @var User The owner of the room.
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

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (is_numeric($value) && Room::roomTypePermitted($this->owner, RoomType::find($value))) {
            return;
        }

        $fail(__('validation.custom.invalid_room_type'));
    }
}
