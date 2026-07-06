<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Prometheus\Collectors;

use App\Prometheus\CollectorRegistry;

interface Collector
{
    public function register(CollectorRegistry $registry): void;

    public function collect(): void;
}
