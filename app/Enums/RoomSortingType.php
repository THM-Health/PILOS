<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Room sorting types
 * @package App\Enums
 */
enum RoomSortingType : string
{
    case ALPHA = 'alpha';
    case LAST_STARTED = 'last_started';
    case ROOM_TYPE = 'room_type';
}
