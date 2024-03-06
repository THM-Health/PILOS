<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Possible link targets
 * @package App\Enums
 */
enum LinkTarget : string
{
    case BLANK = 'blank';
    case SELF = 'self';
}
