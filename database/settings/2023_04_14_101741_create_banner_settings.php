<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('banner.enabled', false);
        $this->migrator->add('banner.message');
        $this->migrator->add('banner.link');
        $this->migrator->add('banner.icon');
        $this->migrator->add('banner.color');
        $this->migrator->add('banner.background');
        $this->migrator->add('banner.title');
        $this->migrator->add('banner.link_style', \App\Enums\LinkButtonStyle::PRIMARY);
        $this->migrator->add('banner.link_text');
        $this->migrator->add('banner.link_target', \App\Enums\LinkTarget::BLANK);
    }
};
