<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Room sorting types
 * @package App\Enums
 */
final class RoomSortingType extends Enum
{
    public const ALPHA         =   'alpha';
    public const LAST_STARTED  =   'last_started';
    public const ROOM_TYPE     =   'room_type';
}
