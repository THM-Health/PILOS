<?php

declare(strict_types=1);

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.accessibility_statement_url', config('settings.defaults.general.accessibility_statement_url'));
    }

    public function down(): void
    {
        $this->migrator->delete('general.accessibility_statement_url');
    }
};
