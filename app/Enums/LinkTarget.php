<?php

namespace App\Enums;

/**
 * Possible link targets
 * @package App\Enums
 */
enum LinkTarget : string
{
    case BLANK = 'blank';
    case SELF  = 'self';
}
