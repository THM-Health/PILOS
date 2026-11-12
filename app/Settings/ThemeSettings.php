<?php

declare(strict_types=1);

namespace App\Settings;

use App\Enums\ColorMode;
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

    public ?ColorMode $enforced_color_mode;

    public static function group(): string
    {
        return 'theme';
    }
}
