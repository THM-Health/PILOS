<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Enums;

/**
 * User role in a room enum
 */
enum RoomUserRole: int
{
    case GUEST = 0;
    case USER = 1;
    case MODERATOR = 2;
    case CO_OWNER = 3;
    case OWNER = 4;

    public function label(): string
    {
        return match ($this) {
            RoomUserRole::GUEST => 'Guest',
            RoomUserRole::USER => 'User',
            RoomUserRole::MODERATOR => 'Moderator',
            RoomUserRole::CO_OWNER => 'Co-Owner',
            RoomUserRole::OWNER => 'Owner',
        };
    }
}
