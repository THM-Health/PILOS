<?php

namespace App\Enums;

use BenSampo\Enum\Enum;

/**
 * Possible link button styles
 * @package App\Enums
 */
final class LinkButtonStyle extends Enum
{
    const PRIMARY   = 'primary';
    const SECONDARY = 'secondary';
    const SUCCESS   = 'success';
    const DANGER    = 'danger';
    const WARNING   = 'warning';
    const INFO      = 'info';
    const LIGHT     = 'light';
    const DARK      = 'dark';
    const LINK      = 'link';
}
