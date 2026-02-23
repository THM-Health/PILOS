<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.accessibility_url', config('settings.defaults.general.accessibility_url'));
    }

    public function down(): void
    {
        $this->migrator->delete('general.accessibility_url');
    }
};
