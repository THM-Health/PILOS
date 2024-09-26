<?php

namespace App\Enums;

/**
 * Possible link targets
 */
enum LinkTarget: string
{
    case BLANK = 'blank';
    case SELF = 'self';
}
