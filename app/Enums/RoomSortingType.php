<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Room sorting types
 */
enum RoomSortingType: string
{
    case ALPHA = 'alpha';
    case LAST_STARTED = 'last_started';
    case ROOM_TYPE = 'room_type';
}
