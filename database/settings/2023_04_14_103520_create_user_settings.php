<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('user.password_change_allowed', true);
    }

    public function down(): void
    {
        $this->migrator->delete('user.password_change_allowed');
    }
};
