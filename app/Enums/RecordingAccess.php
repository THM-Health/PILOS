<?php

// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Enums;

enum RecordingAccess: int
{
    // everyone with access to the room, might require authentication or access code
    case EVERYONE = 0;

    // room member with role participant
    case PARTICIPANT = 1;

    // room member with role moderator
    case MODERATOR = 2;

    // room member with role co_owner or room owner
    case OWNER = 3;
}
