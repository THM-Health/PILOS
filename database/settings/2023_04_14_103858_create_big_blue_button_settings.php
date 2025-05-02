<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('bbb.logo');
        $this->migrator->add('bbb.style');
        $this->migrator->add('bbb.default_presentation');
    }

    public function down(): void
    {
        $this->migrator->delete('bbb.logo');
        $this->migrator->delete('bbb.style');
        $this->migrator->delete('bbb.default_presentation');
    }
};
