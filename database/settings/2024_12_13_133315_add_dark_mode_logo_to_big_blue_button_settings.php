<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('bbb.logo_dark');
    }

    public function down(): void
    {
        $this->migrator->delete('bbb.logo_dark');
    }
};
