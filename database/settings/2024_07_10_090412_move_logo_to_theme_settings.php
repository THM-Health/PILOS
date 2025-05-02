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

    public function down(): void
    {
        $this->migrator->rename('theme.favicon', 'general.favicon');
        $this->migrator->rename('theme.logo', 'general.logo');

        $this->migrator->delete('theme.favicon_dark');
        $this->migrator->delete('theme.logo_dark');
    }
};
