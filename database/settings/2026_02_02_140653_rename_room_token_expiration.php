<?php

declare(strict_types=1);

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->rename('room.token_expiration', 'room.personalized_link_expiration');
    }

    public function down(): void
    {
        $this->migrator->rename('room.personalized_link_expiration', 'room.token_expiration');
    }
};
