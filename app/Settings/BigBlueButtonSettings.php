<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class BigBlueButtonSettings extends Settings
{
    public ?string $logo;

    public ?string $logo_dark;

    public ?string $style;

    public ?string $default_presentation;

    public static function group(): string
    {
        return 'bbb';
    }
}
