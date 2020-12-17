<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Custom status response codes of the api
 * @package App\Enums
 */
final class ServerStatus extends Enum
{
    const DISABLED         =   -1;
    const OFFLINE          =   0;
    const ONLINE           =   1;
}
