<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Settings;

use App\Enums\TimePeriod;
use Spatie\LaravelSettings\Settings;

class RecordingSettings extends Settings
{
    public bool $server_usage_enabled;

    public TimePeriod $server_usage_retention_period;

    public bool $meeting_usage_enabled;

    public TimePeriod $meeting_usage_retention_period;

    public TimePeriod $attendance_retention_period;

    public TimePeriod $recording_retention_period;

    public static function group(): string
    {
        return 'recording';
    }
}
