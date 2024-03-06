<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Lobby/Waiting room settings enum
 * @package App\Enums
 */
enum RoomLobby : int
{
    case DISABLED = 0;
    case ENABLED = 1;
    case ONLY_GUEST = 2;
}
