<?php

namespace App\Enums;

/**
 * Lobby/Waiting room settings enum
 */
enum RoomGuestAuthenticationTokenType: int
{
    case CODE = 0;
    case TOKEN = 1;
}
