<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->rename('general.favicon', 'theme.favicon');
        $this->migrator->rename('general.logo', 'theme.logo');

        $this->migrator->add('theme.favicon_dark', config('settings.defaults.theme.favicon_dark'));
        $this->migrator->add('theme.logo_dark', config('settings.defaults.theme.logo_dark'));

    }
};
