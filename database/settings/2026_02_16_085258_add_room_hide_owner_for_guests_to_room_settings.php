<?php

declare(strict_types=1);

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('room.hide_owner_from_guests', false);
    }

    public function down(): void
    {
        $this->migrator->delete('room.hide_owner_from_guests');
    }
};
