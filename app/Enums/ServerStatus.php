<?php

declare(strict_types=1);

namespace App\Enums;

enum ServerStatus: int
{
    case DISABLED = -1;
    case DRAINING = 0;
    case ENABLED = 1;
}
