<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * @method static static OptionOne()
 * @method static static OptionTwo()
 * @method static static OptionThree()
 */
final class RoomSecurityLevel extends Enum
{
    const PUBLIC   =   0;
    const INTERNAL =   1;
    const PRIVATE  = 2;
}
