<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Lobby/Waiting room settings enum
 * @package App\Enums
 */
final class RoomLobby extends Enum
{
    const DISABLED      =   0;
    const ENABLED       =   1;
    const ONLY_GUEST    =   2;
}
