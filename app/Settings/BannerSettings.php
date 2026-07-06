<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Settings;

use App\Enums\LinkButtonStyle;
use App\Enums\LinkTarget;
use Spatie\LaravelSettings\Settings;

class BannerSettings extends Settings
{
    public bool $enabled;

    public ?string $message;

    public ?string $link;

    public ?string $icon;

    public ?string $color;

    public ?string $background;

    public ?string $title;

    public LinkButtonStyle $link_style;

    public ?string $link_text;

    public LinkTarget $link_target;

    public static function group(): string
    {
        return 'banner';
    }
}
