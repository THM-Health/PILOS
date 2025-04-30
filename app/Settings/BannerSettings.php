<?php

namespace App\Settings;

use App\Enums\LinkButtonStyle;
use App\Enums\LinkTarget;
use Spatie\LaravelSettings\Settings;

class BannerSettings extends Settings
{
    public bool $enabled;

    public ?string $message = null;

    public ?string $link = null;

    public ?string $icon = null;

    public ?string $color = null;

    public ?string $background = null;

    public ?string $title = null;

    public LinkButtonStyle $link_style;

    public ?string $link_text = null;

    public LinkTarget $link_target;

    public static function group(): string
    {
        return 'banner';
    }
}
