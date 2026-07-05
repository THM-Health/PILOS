<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Services;

use App\Models\Meeting;

class StreamingServiceFactory
{
    public static function make(Meeting $meeting): StreamingService
    {
        return new StreamingService($meeting);
    }
}
