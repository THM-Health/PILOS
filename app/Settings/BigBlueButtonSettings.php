<?php

declare(strict_types=1);

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class BigBlueButtonSettings extends Settings
{
    public ?string $logo;

    public ?string $logo_dark;

    public ?string $style;

    public ?string $default_presentation;

    public ?string $client_settings;

    public ?string $default_welcome_message;

    public static function group(): string
    {
        return 'bbb';
    }
}
