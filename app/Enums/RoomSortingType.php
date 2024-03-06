<?php

namespace App\Enums;

/**
 * Room sorting types
 * @package App\Enums
 */
enum RoomSortingType : string
{
    case ALPHA        = 'alpha';
    case LAST_STARTED = 'last_started';
    case ROOM_TYPE    = 'room_type';
}
