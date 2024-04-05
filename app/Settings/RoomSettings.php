<?php

namespace App\Settings;

use App\Enums\TimePeriod;
use Spatie\LaravelSettings\Settings;

class RoomSettings extends Settings
{
    public int $limit;

    public int $pagination_page_size;

    public TimePeriod $token_expiration;

    public TimePeriod $auto_delete_inactive_period;

    public TimePeriod $auto_delete_never_used_period;

    public TimePeriod $auto_delete_deadline_period;

    public static function group(): string
    {
        return 'room';
    }
}
