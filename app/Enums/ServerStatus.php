<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Custom status response codes of the api
 * @package App\Enums
 */
final class ServerStatus extends Enum
{
    public const DISABLED         =   -1;
    public const OFFLINE          =   0;
    public const ONLINE           =   1;
}
