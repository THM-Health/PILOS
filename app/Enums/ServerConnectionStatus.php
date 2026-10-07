<?php

declare(strict_types=1);

namespace App\Enums;

enum ServerConnectionStatus: int
{
    case ONLINE = 1;
    case FAULTY = 0;
    case OFFLINE = -1;
}
