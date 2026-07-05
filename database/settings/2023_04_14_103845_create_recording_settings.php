<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

use App\Enums\TimePeriod;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('recording.server_usage_enabled', true);
        $this->migrator->add('recording.server_usage_retention_period', TimePeriod::ONE_MONTH);

        $this->migrator->add('recording.meeting_usage_enabled', true);
        $this->migrator->add('recording.meeting_usage_retention_period', TimePeriod::ONE_MONTH);

        $this->migrator->add('recording.attendance_retention_period', TimePeriod::TWO_WEEKS);

        $this->migrator->add('recording.recording_retention_period', TimePeriod::ONE_YEAR);
    }

    public function down(): void
    {
        $this->migrator->delete('recording.server_usage_enabled');
        $this->migrator->delete('recording.server_usage_retention_period');

        $this->migrator->delete('recording.meeting_usage_enabled');
        $this->migrator->delete('recording.meeting_usage_retention_period');

        $this->migrator->delete('recording.attendance_retention_period');

        $this->migrator->delete('recording.recording_retention_period');
    }
};
