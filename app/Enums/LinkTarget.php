<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Possible link targets
 * @package App\Enums
 */
final class LinkTarget extends Enum
{
    const BLANK  = 'blank';
    const SELF   = 'self';
}
