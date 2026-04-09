<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Custom status response codes of the api
 */
enum ServerStatus: int
{
    case DISABLED = -1;
    case DRAINING = 0;
    case ENABLED = 1;
}
