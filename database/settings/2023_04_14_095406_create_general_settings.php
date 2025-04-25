<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.name', config('settings.defaults.general.name'));
        $this->migrator->add('general.help_url', config('settings.defaults.general.help_url'));
        $this->migrator->add('general.legal_notice_url', config('settings.defaults.general.legal_notice_url'));
        $this->migrator->add('general.privacy_policy_url', config('settings.defaults.general.privacy_policy_url'));
        $this->migrator->add('general.favicon', config('settings.defaults.theme.favicon'));
        $this->migrator->add('general.logo', config('settings.defaults.theme.logo'));
        $this->migrator->add('general.pagination_page_size', 20);
        $this->migrator->add('general.default_timezone', config('settings.defaults.general.default_timezone'));
    }

    public function down(): void
    {
        $this->migrator->delete('general.name');
        $this->migrator->delete('general.help_url');
        $this->migrator->delete('general.legal_notice_url');
        $this->migrator->delete('general.privacy_policy_url');
        $this->migrator->delete('general.favicon');
        $this->migrator->delete('general.logo');
        $this->migrator->delete('general.pagination_page_size');
        $this->migrator->delete('general.default_timezone');
    }
};
