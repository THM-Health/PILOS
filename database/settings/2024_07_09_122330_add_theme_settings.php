<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('theme.primary_color', '#14b8a6');
        $this->migrator->add('theme.rounded', true);
    }

    public function down(): void
    {
        $this->migrator->delete('theme.primary_color');
        $this->migrator->delete('theme.rounded');
    }
};
