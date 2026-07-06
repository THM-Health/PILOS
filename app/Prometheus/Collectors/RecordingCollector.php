<?php

// SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

declare(strict_types=1);

namespace App\Prometheus\Collectors;

use App\Models\Recording;
use App\Prometheus\CollectorRegistry;
use App\Prometheus\Gauge;

class RecordingCollector implements Collector
{
    public function register(CollectorRegistry $registry): void
    {
        Gauge::register($registry, 'recordings_total', 'Total number of recordings');
    }

    public function collect(): void
    {
        Gauge::get('recordings_total')
            ->set(Recording::count());
    }
}
