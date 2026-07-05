<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class StreamingSettings extends Settings
{
    public ?string $default_pause_image;

    public ?string $css_file;

    public ?string $join_parameters;

    public static function group(): string
    {
        return 'streaming';
    }
}
