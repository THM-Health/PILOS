<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Possible link targets
 * @package App\Enums
 */
final class LinkTarget extends Enum
{
    public const BLANK  = 'blank';
    public const SELF   = 'self';
}
