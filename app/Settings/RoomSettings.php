<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Settings;

use App\Enums\TimePeriod;
use Spatie\LaravelSettings\Settings;

class RoomSettings extends Settings
{
    public int $limit;

    public TimePeriod $personalized_link_expiration;

    public TimePeriod $auto_delete_inactive_period;

    public TimePeriod $auto_delete_never_used_period;

    public TimePeriod $auto_delete_deadline_period;

    public ?string $file_terms_of_use;

    public bool $hide_owner_from_guests;

    public static function group(): string
    {
        return 'room';
    }
}
