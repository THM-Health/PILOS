<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->rename('general.favicon', 'theme.favicon');
        $this->migrator->rename('general.logo', 'theme.logo');

        $this->migrator->add('theme.favicon_dark', config('settings.defaults.general.favicon'));
        $this->migrator->add('theme.logo_dark', config('settings.defaults.general.logo'));

    }
};
