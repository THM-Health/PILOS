<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.no_welcome_page', false);
    }

    public function down(): void
    {
        $this->migrator->delete('general.no_welcome_page');
    }
};
