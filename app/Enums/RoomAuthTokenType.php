<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Type of the room auth token enum
 */
enum RoomAuthTokenType: int
{
    case CODE = 0;

    case PERSONALIZED_LINK = 1;
}
