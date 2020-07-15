<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * @method static static OptionOne()
 * @method static static OptionTwo()
 * @method static static OptionThree()
 */
final class RoomLobby extends Enum
{
    const DISABLED      =   0;
    const ENABLED       =   1;
    const ONLY_GUEST    = 2;
}
