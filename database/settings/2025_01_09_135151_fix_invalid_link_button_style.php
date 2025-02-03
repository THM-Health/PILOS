<?php

use App\Enums\LinkButtonStyle;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->update(
            'banner.link_style',
            function (LinkButtonStyle $style) {
                return LinkButtonStyle::getDeprecationReplacement($style);
            }
        );
    }
};
