<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class ThemeSettings extends Settings
{
    public string $primary_color;

    public bool $rounded;

    public static function group(): string
    {
        return 'theme';
    }
}
