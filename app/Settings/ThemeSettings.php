<?php

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

    public static function group(): string
    {
        return 'theme';
    }
}
