<?php

use App\Enums\TimePeriod;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('room.limit', -1);
        $this->migrator->add('room.token_expiration', TimePeriod::THREE_MONTHS);
        $this->migrator->add('room.auto_delete_inactive_period', TimePeriod::UNLIMITED);
        $this->migrator->add('room.auto_delete_never_used_period', TimePeriod::UNLIMITED);
        $this->migrator->add('room.auto_delete_deadline_period', TimePeriod::TWO_WEEKS);
    }

    public function down(): void
    {
        $this->migrator->delete('room.limit');
        $this->migrator->delete('room.token_expiration');
        $this->migrator->delete('room.auto_delete_inactive_period');
        $this->migrator->delete('room.auto_delete_never_used_period');
        $this->migrator->delete('room.auto_delete_deadline_period');
    }
};
