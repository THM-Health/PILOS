<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Custom status response codes of the api
 * @package App\Enums
 */
enum ServerStatus : int
{
    case DISABLED = -1;
    case OFFLINE = 0;
    case ONLINE = 1;
}
