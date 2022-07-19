<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * User role in a room enum
 * @package App\Enums
 */
final class RoomUserRole extends Enum
{
    public const GUEST     =   0;
    public const USER      =   1;
    public const MODERATOR =   2;
    public const CO_OWNER  =   3;
    public const OWNER     =   4;
}
