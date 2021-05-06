<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * User role in a room enum
 * @package App\Enums
 */
final class RoomUserRole extends Enum
{
    const GUEST     =   0;
    const USER      =   1;
    const MODERATOR =   2;
    const CO_OWNER  =   3;
    const OWNER     =   4;
}
