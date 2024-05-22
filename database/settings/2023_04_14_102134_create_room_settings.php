<?php

use App\Enums\TimePeriod;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('room.limit', -1);
        $this->migrator->add('room.pagination_page_size', 9);
        $this->migrator->add('room.token_expiration', TimePeriod::THREE_MONTHS);
        $this->migrator->add('room.auto_delete_inactive_period', TimePeriod::UNLIMITED);
        $this->migrator->add('room.auto_delete_never_used_period', TimePeriod::UNLIMITED);
        $this->migrator->add('room.auto_delete_deadline_period', TimePeriod::TWO_WEEKS);
    }
};
