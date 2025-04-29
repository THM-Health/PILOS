<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class BigBlueButtonSettings extends Settings
{
    public ?string $logo = null;

    public ?string $logo_dark = null;

    public ?string $style = null;

    public ?string $default_presentation = null;

    public static function group(): string
    {
        return 'bbb';
    }
}
