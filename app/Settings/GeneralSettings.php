<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class GeneralSettings extends Settings
{
    public string $name;

    public ?string $help_url;

    public ?string $legal_notice_url;

    public ?string $privacy_policy_url;

    public int $pagination_page_size;

    public string $default_timezone;

    public int $toast_lifetime;

    public bool $no_welcome_page;

    public static function group(): string
    {
        return 'general';
    }
}
