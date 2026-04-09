<?php

declare(strict_types=1);

namespace App\Enums;

enum RoomVisibility: int
{
    case PRIVATE = 0;
    case PUBLIC = 1;
}
