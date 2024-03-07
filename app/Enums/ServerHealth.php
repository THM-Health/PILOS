<?php

namespace App\Enums;

/**
 * Custom status response codes of the api
 */
enum ServerHealth: int
{
    case ONLINE = 1;
    case UNHEALTHY = 0;
    case OFFLINE = -1;
}
