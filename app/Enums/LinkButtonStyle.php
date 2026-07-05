<?php

// SPDX-FileCopyrightText: 2021 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

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
