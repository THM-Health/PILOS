<?php

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
