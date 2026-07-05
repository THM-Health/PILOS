<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

return [
    'enabled' => env('ANTIVIRUS_ENABLED', false),
    'clamav' => [
        'url' => env('ANTIVIRUS_CLAMAV_URL'),
    ],
];
