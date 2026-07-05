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
        $this->migrator->rename('room.token_expiration', 'room.personalized_link_expiration');
    }

    public function down(): void
    {
        $this->migrator->rename('room.personalized_link_expiration', 'room.token_expiration');
    }
};
