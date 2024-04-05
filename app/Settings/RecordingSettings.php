<?php

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

    public static function group(): string
    {
        return 'recording';
    }
}
