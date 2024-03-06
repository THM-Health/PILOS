<?php

namespace App\Enums;

/**
 * Possible link button styles
 * @package App\Enums
 */
enum LinkButtonStyle : string
{
    case PRIMARY   = 'primary';
    case SECONDARY = 'secondary';
    case SUCCESS   = 'success';
    case DANGER    = 'danger';
    case WARNING   = 'warning';
    case INFO      = 'info';
    case HELP      = 'help';
    case CONTRAST  = 'contrast';
    case LINK      = 'link';
}
