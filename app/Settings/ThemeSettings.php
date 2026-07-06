<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class ThemeSettings extends Settings
{
    public string $logo;

    public string $logo_dark;

    public string $favicon;

    public string $favicon_dark;

    public string $primary_color;

    public bool $rounded;

    public ?string $custom_css;

    public static function group(): string
    {
        return 'theme';
    }
}
