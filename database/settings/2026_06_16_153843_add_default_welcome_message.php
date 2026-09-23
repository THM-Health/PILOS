<?php

declare(strict_types=1);

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('bbb.default_welcome_message');
    }

    public function down(): void
    {
        $this->migrator->delete('bbb.default_welcome_message');
    }
};
