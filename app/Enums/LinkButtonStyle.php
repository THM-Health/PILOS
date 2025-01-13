<?php

namespace App\Enums;

/**
 * Possible link button styles
 */
enum LinkButtonStyle: string
{
    case PRIMARY = 'primary';
    case SECONDARY = 'secondary';
    case SUCCESS = 'success';
    case DANGER = 'danger';
    case WARN = 'warn';
    case INFO = 'info';
    case HELP = 'help';
    case CONTRAST = 'contrast';
    case LINK = 'link';

    /** @deprecated Use LinkButtonStyle::WARN instead */
    case WARNING = 'warning';

    public static function getDeprecated(): array
    {
        return [self::WARNING];
    }

    public static function getDeprecationReplacement(LinkButtonStyle $linkButtonStyle): LinkButtonStyle
    {
        return match ($linkButtonStyle) {
            self::WARNING => self::WARN,
            default => $linkButtonStyle,
        };
    }
}
