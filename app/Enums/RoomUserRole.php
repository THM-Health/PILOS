<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * @method static static OptionOne()
 * @method static static OptionTwo()
 * @method static static OptionThree()
 */
final class RoomUserRole extends Enum
{
    const GUEST     =   0;
    const USER      =   1;
    const MODERATOR = 2;
}
