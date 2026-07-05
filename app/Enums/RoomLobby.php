<?php

// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Enums;

/**
 * Lobby/Waiting room settings enum
 */
enum RoomLobby: int
{
    case DISABLED = 0;
    case ENABLED = 1;
    case ONLY_GUEST = 2;
}
