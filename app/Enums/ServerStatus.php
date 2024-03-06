<?php

namespace App\Enums;

/**
 * Custom status response codes of the api
 */
enum ServerStatus: int
{
    case DISABLED = -1;
    case OFFLINE = 0;
    case ONLINE = 1;
}
