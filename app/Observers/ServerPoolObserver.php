<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Observers;

use App\Models\ServerPool;

class ServerPoolObserver
{
    /**
     * Handle the ServerPool "deleting" event.
     */
    public function deleting(ServerPool $serverPool): bool
    {
        // Delete server pool only possible if no room types associated
        if ($serverPool->roomTypes()->count() != 0) {
            return false;
        }

        return true;
    }
}
