<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class UserSettings extends Settings
{
    public bool $password_change_allowed;

    public static function group(): string
    {
        return 'user';
    }
}
