<?php

declare(strict_types=1);

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class UserSettings extends Settings
{
    public bool $password_change_allowed;

    public bool $search_by_name;

    public static function group(): string
    {
        return 'user';
    }
}
