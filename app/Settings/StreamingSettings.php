<?php

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
