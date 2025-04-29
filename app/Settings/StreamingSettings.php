<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class StreamingSettings extends Settings
{
    public ?string $default_pause_image = null;

    public ?string $css_file = null;

    public ?string $join_parameters = null;

    public static function group(): string
    {
        return 'streaming';
    }
}
