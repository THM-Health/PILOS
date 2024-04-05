<?php

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
    }
};
