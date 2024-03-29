<?php

namespace App\Enums;

/**
 * Lobby/Waiting room settings enum
 */
enum RoomLobby: int
{
    case DISABLED = 0;
    case ENABLED = 1;
    case ONLY_GUEST = 2;
}
