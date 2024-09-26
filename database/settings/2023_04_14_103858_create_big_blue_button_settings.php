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
};
