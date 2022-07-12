<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Lobby/Waiting room settings enum
 * @package App\Enums
 */
final class RoomLobby extends Enum
{
    public const DISABLED      =   0;
    public const ENABLED       =   1;
    public const ONLY_GUEST    =   2;
}
