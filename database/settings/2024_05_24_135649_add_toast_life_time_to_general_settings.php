<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.toast_lifetime', 5);
    }

    public function down(): void
    {
        $this->migrator->delete('general.toast_lifetime');
    }
};
