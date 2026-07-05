<?php

// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Enums;

/**
 * Type of the room auth token enum
 */
enum RoomAuthTokenType: int
{
    case CODE = 0;

    case PERSONALIZED_LINK = 1;
}
