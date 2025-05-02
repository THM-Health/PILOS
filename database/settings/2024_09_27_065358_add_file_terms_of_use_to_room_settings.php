<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('room.file_terms_of_use');
    }

    public function down(): void
    {
        $this->migrator->delete('room.file_terms_of_use');
    }
};
