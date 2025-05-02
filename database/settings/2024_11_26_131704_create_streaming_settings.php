<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('streaming.default_pause_image');
        $this->migrator->add('streaming.css_file');
        $this->migrator->add('streaming.join_parameters');
    }

    public function down(): void
    {
        $this->migrator->delete('streaming.default_pause_image');
        $this->migrator->delete('streaming.css_file');
        $this->migrator->delete('streaming.join_parameters');
    }
};
