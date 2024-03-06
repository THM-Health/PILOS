<?php

namespace App\Enums;

/**
 * User role in a room enum
 * @package App\Enums
 */
enum RoomUserRole : int
{
    case GUEST     = 0;
    case USER      = 1;
    case MODERATOR = 2;
    case CO_OWNER  = 3;
    case OWNER     = 4;

    public function label(): string
    {
        return match ($this) {
            RoomUserRole::GUEST     => 'Guest',
            RoomUserRole::USER      => 'User',
            RoomUserRole::MODERATOR => 'Moderator',
            RoomUserRole::CO_OWNER  => 'Co-Owner',
            RoomUserRole::OWNER     => 'Owner',
        };
    }
}
