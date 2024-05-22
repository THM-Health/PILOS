<?php

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
