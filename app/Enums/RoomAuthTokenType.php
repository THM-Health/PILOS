<?php

namespace App\Enums;

/**
 * Type of the room auth token enum
 */
enum RoomAuthTokenType: int
{
    case CODE = 0;

    case TOKEN = 1;
}
